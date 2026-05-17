import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIChatService } from './ai-chat.service';
import { AIChatController } from './ai-chat.controller';
import { Incorporation } from '../../compliance/incorporation/entities/incorporation.entity';
import { IncMasterData } from '../../compliance/incorporation/entities/inc-master-data.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Incorporation, IncMasterData]),
  ],
  controllers: [AIChatController],
  providers: [AIChatService],
  exports: [AIChatService],
})
export class AIChatModule {}
