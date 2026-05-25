import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { AiService } from '../services/ai.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UpdateConversationDto } from '../dto/conversation.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /**
   * GET /api/ai/conversations
   * List all conversations for current user
   */
  @Get('conversations')
  async getConversations(@Req() req: { user: { userId: string } }) {
    return this.aiService.getConversations(req.user.userId);
  }

  /**
   * GET /api/ai/conversations/:id
   * Get a specific conversation with full message history
   */
  @Get('conversations/:id')
  async getConversation(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
  ) {
    return this.aiService.getConversation(id, req.user.userId);
  }

  /**
   * POST /api/ai/conversations
   * Create a new conversation
   */
  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  async createConversation(@Req() req: { user: { userId: string } }) {
    return this.aiService.createConversation(req.user.userId);
  }

  /**
   * PUT /api/ai/conversations/:id
   * Update conversation (title, pinned state, etc.)
   */
  @Put('conversations/:id')
  async updateConversation(
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
    @Req() req: { user: { userId: string } },
  ) {
    return this.aiService.updateConversation(id, req.user.userId, dto);
  }

  /**
   * DELETE /api/ai/conversations/:id
   * Delete a conversation
   */
  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConversation(
    @Param('id') id: string,
    @Req() req: { user: { userId: string } },
  ) {
    await this.aiService.deleteConversation(id, req.user.userId);
  }

  /**
   * GET /api/ai/usage
   * Get AI usage statistics for current user
   */
  @Get('usage')
  async getUsageStats(@Req() req: { user: { userId: string } }) {
    return this.aiService.getUsageStats(req.user.userId);
  }

  /**
   * POST /api/ai/conversations/new
   * Start a new conversation with a first message (HTTP fallback)
   */
  @Post('conversations/new')
  @HttpCode(HttpStatus.CREATED)
  async startConversation(
    @Body() dto: CreateMessageDto,
    @Req() req: { user: { userId: string } },
  ) {
    const conv = await this.aiService.createConversation(req.user.userId, dto.message.slice(0, 60));
    return { conversation_id: conv.id };
  }
}
