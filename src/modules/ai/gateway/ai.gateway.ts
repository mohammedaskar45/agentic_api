import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../services/ai.service';

interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    email: string;
    role_id: string;
  };
}

// Rate limiting: 60 requests per minute per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/ai',
})
export class AiGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly aiService: AiService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    const token =
      client.handshake?.auth?.token ||
      client.handshake?.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      client.emit('error', { message: 'Authentication required' });
      client.disconnect();
      return;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      }) as any;
      client.user = {
        userId: payload.user_id || payload.sub,
        email: payload.mail_id || payload.email,
        role_id: payload.role_id,
      };
      client.emit('connected', { message: 'AI Gateway connected', userId: client.user.userId });
    } catch {
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    // Cleanup if needed
    console.log(`AI client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: { message: string; conversation_id?: string },
  ) {
    if (!client.user) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    const { userId } = client.user;

    // Rate limiting
    if (!checkRateLimit(userId)) {
      client.emit('error', {
        message: 'Rate limit exceeded. Please wait before sending more messages.',
        code: 'RATE_LIMIT',
      });
      return;
    }

    // Input validation
    if (!data.message || typeof data.message !== 'string') {
      client.emit('error', { message: 'Message must be a non-empty string' });
      return;
    }

    if (data.message.length > 10000) {
      client.emit('error', { message: 'Message too long (max 10,000 characters)' });
      return;
    }

    client.emit('stream_start', { timestamp: new Date().toISOString() });

    try {
      const stream = this.aiService.streamMessage(
        data.message,
        userId,
        data.conversation_id,
      );

      for await (const event of stream) {
        switch (event.type) {
          case 'conversation_id':
            client.emit('conversation_id', { conversation_id: event.conversationId });
            break;
          case 'thinking':
            client.emit('thinking', { status: true });
            break;
          case 'chunk':
            client.emit('stream_chunk', { content: event.content });
            break;
          case 'tool_call':
            client.emit('tool_call', event.toolCall);
            break;
          case 'done':
            client.emit('stream_end', {
              content: event.content,
              timestamp: new Date().toISOString(),
            });
            break;
          case 'error':
            client.emit('stream_error', { message: event.content });
            break;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred';
      client.emit('stream_error', { message: msg });
    }
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: Date.now() });
  }
}
