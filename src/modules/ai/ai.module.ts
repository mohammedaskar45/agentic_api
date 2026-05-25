import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Conversation } from './entities/conversation.entity';
import { AiAuditLog } from './entities/ai_audit_log.entity';
import { AiService } from './services/ai.service';
import { AiController } from './controllers/ai.controller';
import { AiGateway } from './gateway/ai.gateway';
import { PostgresTool, SchemaReaderTool } from './tools/postgres.tool';
import { FileReaderTool } from './tools/file-reader.tool';
import { DtoAnalyzerTool } from './tools/dto-analyzer.tool';
import { ApiRouteAnalyzerTool } from './tools/api-route-analyzer.tool';
import { ReactFormAnalyzerTool } from './tools/react-form-analyzer.tool';
import { UserCreationTool } from './tools/user-creation.tool';
import { PromptBuilderTool } from './tools/prompt-builder.tool';
import { AiAccessGuard, WsAiAccessGuard } from './middlewares/ai-access.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, AiAuditLog]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [AiController],
  providers: [
    AiService,
    AiGateway,
    SchemaReaderTool,
    PostgresTool,
    FileReaderTool,
    DtoAnalyzerTool,
    ApiRouteAnalyzerTool,
    ReactFormAnalyzerTool,
    UserCreationTool,
    PromptBuilderTool,
    AiAccessGuard,
    WsAiAccessGuard,
  ],
  exports: [AiService],
})
export class AiModule {}
