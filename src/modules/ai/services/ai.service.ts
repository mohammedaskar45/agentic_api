import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { Conversation, ChatMessage, ToolCallLog } from '../entities/conversation.entity';
import { AiAuditLog } from '../entities/ai_audit_log.entity';
import { PostgresTool, SchemaReaderTool } from '../tools/postgres.tool';
import { FileReaderTool } from '../tools/file-reader.tool';
import { DtoAnalyzerTool } from '../tools/dto-analyzer.tool';
import { ApiRouteAnalyzerTool } from '../tools/api-route-analyzer.tool';
import { ReactFormAnalyzerTool } from '../tools/react-form-analyzer.tool';
import { UserCreationTool } from '../tools/user-creation.tool';
import { PromptBuilderTool } from '../tools/prompt-builder.tool';
import { v4 as uuidv4 } from 'uuid';

const OPENAI_TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'query_database',
      description:
        'Execute a safe read-only SQL SELECT query on the PostgreSQL database. Only SELECT/COUNT/aggregation queries are allowed. Sensitive fields like passwords and tokens are automatically redacted.',
      parameters: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'The SQL SELECT query to execute' },
        },
        required: ['sql'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_schema',
      description:
        'Get the full database schema including all tables and columns. Use this to understand the database structure before writing queries.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description: 'Read the contents of a source code file from the project directories.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute path to the file' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_directory',
      description: 'List files and folders in a project directory recursively.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute path to the directory' },
          recursive: { type: 'boolean', description: 'Whether to list recursively' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_dto',
      description: 'Parse a TypeScript DTO file to extract field names, types, and validation decorators.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute path to the DTO file' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_controller',
      description: 'Parse a NestJS controller file to extract API routes, HTTP methods, and handler information.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute path to the controller file' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_react_form',
      description: 'Parse a React component file to extract form fields and validation rules.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Absolute path to the React form component' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_user',
      description:
        'Create a new user in the system. Requires: name, mail_id, password, role_id. Optional: first_name, last_name, mobile_no, user_type.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          mail_id: { type: 'string' },
          password: { type: 'string' },
          role_id: { type: 'string' },
          first_name: { type: 'string' },
          last_name: { type: 'string' },
          mobile_no: { type: 'string' },
          user_type: { type: 'string', enum: ['Admin', 'User', 'Viewer'] },
        },
        required: ['name', 'mail_id', 'password', 'role_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_available_roles',
      description: 'Get the list of available roles in the system for user assignment.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

@Injectable()
export class AiService {
  private openai: OpenAI;
  private systemPromptCache: string | null = null;

  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(AiAuditLog)
    private readonly auditLogRepo: Repository<AiAuditLog>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly postgresTool: PostgresTool,
    private readonly schemaReader: SchemaReaderTool,
    private readonly fileReader: FileReaderTool,
    private readonly dtoAnalyzer: DtoAnalyzerTool,
    private readonly apiRouteAnalyzer: ApiRouteAnalyzerTool,
    private readonly reactFormAnalyzer: ReactFormAnalyzerTool,
    private readonly userCreation: UserCreationTool,
    private readonly promptBuilder: PromptBuilderTool,
  ) {
    const githubToken = this.configService.get<string>('GITHUB_TOKEN');
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (openaiApiKey && openaiApiKey !== 'your_openai_api_key_here' && openaiApiKey.trim() !== '') {
      this.openai = new OpenAI({
        apiKey: openaiApiKey,
      });
    } else {
      this.openai = new OpenAI({
        baseURL: 'https://models.inference.ai.azure.com',
        apiKey: githubToken || '',
      });
    }
  }

  private getModelName(): string {
    const openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (openaiApiKey && openaiApiKey !== 'your_openai_api_key_here' && openaiApiKey.trim() !== '') {
      return this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o';
    }
    return 'gpt-4.1';
  }

  private async getSystemPrompt(): Promise<string> {
    if (!this.systemPromptCache) {
      this.systemPromptCache = await this.promptBuilder.buildSystemPrompt({
        includeSchema: true,
      });
    }
    return this.systemPromptCache;
  }

  invalidateSystemPromptCache() {
    this.systemPromptCache = null;
  }

  async getConversations(userId: string): Promise<Conversation[]> {
    return this.conversationRepo.find({
      where: { user_id: userId, is_archived: false },
      order: { is_pinned: 'DESC', updated_at: 'DESC' },
      select: ['id', 'title', 'is_pinned', 'token_usage', 'created_at', 'updated_at', 'model_used'],
    });
  }

  async getConversation(id: string, userId: string): Promise<Conversation | null> {
    return this.conversationRepo.findOne({
      where: { id, user_id: userId },
    });
  }

  async createConversation(userId: string, title?: string): Promise<Conversation> {
    const conv = this.conversationRepo.create({
      user_id: userId,
      title: title || 'New Conversation',
      messages: [],
    });
    return this.conversationRepo.save(conv);
  }

  async updateConversation(
    id: string,
    userId: string,
    updates: Partial<Conversation>,
  ): Promise<Conversation | null> {
    const conv = await this.conversationRepo.findOne({ where: { id, user_id: userId } });
    if (!conv) return null;
    Object.assign(conv, updates);
    return this.conversationRepo.save(conv);
  }

  async deleteConversation(id: string, userId: string): Promise<boolean> {
    const conv = await this.conversationRepo.findOne({ where: { id, user_id: userId } });
    if (!conv) return false;
    await this.conversationRepo.remove(conv);
    return true;
  }

  async executeToolCall(
    toolName: string,
    args: Record<string, unknown>,
  ): Promise<string> {
    const start = Date.now();
    let result = '';

    try {
      switch (toolName) {
        case 'query_database': {
          const qResult = await this.postgresTool.executeQuery(args.sql as string);
          result = JSON.stringify(qResult, null, 2);
          break;
        }
        case 'read_schema': {
          const schema = await this.schemaReader.getFullSchema();
          result = this.schemaReader.schemaToPromptText(schema);
          break;
        }
        case 'read_file': {
          const fr = this.fileReader.readFile(args.path as string);
          result = fr.content || fr.error || 'Unknown error';
          break;
        }
        case 'list_directory': {
          const lr = args.recursive
            ? this.fileReader.listDirectoryRecursive(args.path as string)
            : this.fileReader.listDirectory(args.path as string);
          result = (lr as { structure?: string; files?: string[] }).structure ||
            ((lr as { files?: string[] }).files || []).join('\n') ||
            (lr as { error?: string }).error || 'Error listing directory';
          break;
        }
        case 'analyze_dto': {
          const dtoResult = this.dtoAnalyzer.analyzeDto(args.path as string);
          result = 'error' in dtoResult
            ? dtoResult.error
            : this.dtoAnalyzer.buildRequiredFieldSummary(dtoResult);
          break;
        }
        case 'analyze_controller': {
          const ctrlResult = this.apiRouteAnalyzer.analyzeController(args.path as string);
          result = 'error' in ctrlResult
            ? ctrlResult.error
            : this.apiRouteAnalyzer.formatRoutesSummary(ctrlResult);
          break;
        }
        case 'analyze_react_form': {
          const formResult = this.reactFormAnalyzer.analyzeForm(args.path as string);
          result = 'error' in formResult
            ? formResult.error
            : this.reactFormAnalyzer.formatFormSummary(formResult);
          break;
        }
        case 'create_user': {
          const createResult = await this.userCreation.createUser(
            args as Parameters<typeof this.userCreation.createUser>[0],
          );
          result = JSON.stringify(createResult, null, 2);
          break;
        }
        case 'get_available_roles': {
          const roles = await this.userCreation.getAvailableRoles();
          result = JSON.stringify(roles, null, 2);
          break;
        }
        default:
          result = `Unknown tool: ${toolName}`;
      }
    } catch (err: unknown) {
      result = `Tool execution error: ${err instanceof Error ? err.message : String(err)}`;
    }

    const duration = Date.now() - start;
    return `[Tool: ${toolName} | ${duration}ms]\n${result}`;
  }

  async *streamMessage(
    userMessage: string,
    userId: string,
    conversationId?: string,
  ): AsyncGenerator<{ type: string; content?: string; conversationId?: string; toolCall?: { name: string; status: string } }> {
    let conv: Conversation;

    if (conversationId) {
      const existing = await this.getConversation(conversationId, userId);
      if (existing) {
        conv = existing;
      } else {
        conv = await this.createConversation(userId);
      }
    } else {
      conv = await this.createConversation(
        userId,
        this.promptBuilder.extractTitleFromFirstMessage(userMessage),
      );
      yield { type: 'conversation_id', conversationId: conv.id };
    }
    console.log('abcd');
    

    // Add user message
    const userMsg: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    conv.messages = [...(conv.messages || []), userMsg];

    const systemPrompt = await this.getSystemPrompt();
    const history = conv.messages
      .slice(-20)
      .map((m: ChatMessage) => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }));

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...history,
    ];

    let assistantContent = '';
    let totalTokens = 0;
    let toolCallsLog: ToolCallLog[] = [];

    // Agentic loop
    let maxIterations = 5;
    while (maxIterations-- > 0) {
      yield { type: 'thinking' };

      try {
        const stream = await this.openai.chat.completions.create({
          model: this.getModelName(),
          messages,
          tools: OPENAI_TOOLS,
          tool_choice: 'auto',
          stream: true,
          max_tokens: 4096,
          temperature: 0.3,
        });

        let currentToolCallId = '';
        let currentToolName = '';
        let currentToolArgs = '';
        const toolCalls: Array<{ id: string; name: string; arguments: string }> = [];

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta;
          if (!delta) continue;

          if (delta.content) {
            assistantContent += delta.content;
            yield { type: 'chunk', content: delta.content };
          }

          if (delta.tool_calls) {
            for (const tc of delta.tool_calls) {
              if (tc.id) {
                if (currentToolName) {
                  toolCalls.push({
                    id: currentToolCallId,
                    name: currentToolName,
                    arguments: currentToolArgs,
                  });
                }
                currentToolCallId = tc.id;
                currentToolName = tc.function?.name || '';
                currentToolArgs = '';
              }
              if (tc.function?.arguments) {
                currentToolArgs += tc.function.arguments;
              }
            }
          }

          if (chunk.choices[0]?.finish_reason === 'tool_calls' && currentToolName) {
            toolCalls.push({
              id: currentToolCallId,
              name: currentToolName,
              arguments: currentToolArgs,
            });
          }

          if (chunk.usage) {
            totalTokens += chunk.usage.total_tokens || 0;
          }
        }

        // If no tool calls, we're done
        if (toolCalls.length === 0) break;

        // Process tool calls
        const assistantMsg: OpenAI.Chat.ChatCompletionMessageParam = {
          role: 'assistant',
          content: assistantContent || '',
          tool_calls: toolCalls.map((tc) => ({
            id: tc.id,
            type: 'function' as const,
            function: { name: tc.name, arguments: tc.arguments },
          })),
        };
        messages.push(assistantMsg);

        for (const tc of toolCalls) {
          yield { type: 'tool_call', toolCall: { name: tc.name, status: 'executing' } };

          let parsedArgs: Record<string, unknown> = {};
          try {
            parsedArgs = JSON.parse(tc.arguments || '{}') as Record<string, unknown>;
          } catch {
            parsedArgs = {};
          }

          const toolStart = Date.now();
          const toolResult = await this.executeToolCall(tc.name, parsedArgs);
          const toolDuration = Date.now() - toolStart;

          toolCallsLog.push({
            tool: tc.name,
            args: parsedArgs,
            result: toolResult.slice(0, 500),
            executedAt: new Date().toISOString(),
            duration_ms: toolDuration,
          });

          yield { type: 'tool_call', toolCall: { name: tc.name, status: 'done' } };

          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: toolResult,
          });
        }

        assistantContent = '';
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        yield { type: 'error', content: `AI service error: ${errMsg}` };
        break;
      }
    }

    // Save assistant message to conversation
    const assistantMsg: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: assistantContent,
      timestamp: new Date().toISOString(),
      tool_calls: toolCallsLog,
      tokens: totalTokens,
    };

    conv.messages = [...conv.messages, assistantMsg];
    conv.token_usage = (conv.token_usage || 0) + totalTokens;

    // Auto-update title from first exchange
    if (conv.messages.length === 2) {
      conv.title = this.promptBuilder.extractTitleFromFirstMessage(userMessage);
    }

    await this.conversationRepo.save(conv);

    yield { type: 'done', content: assistantContent };
  }

  async getUsageStats(userId: string): Promise<{
    total_conversations: number;
    total_tokens: number;
    total_messages: number;
  }> {
    const convs = await this.conversationRepo.find({ where: { user_id: userId } });
    return {
      total_conversations: convs.length,
      total_tokens: convs.reduce((sum, c) => sum + (c.token_usage || 0), 0),
      total_messages: convs.reduce((sum, c) => sum + (c.messages?.length || 0), 0),
    };
  }
}
