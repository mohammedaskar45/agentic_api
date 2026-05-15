import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RightsIssue, RiMasterData } from './entities/rights-issue.entity';
import { RightsIssueService } from './rights-issue.service';
import { RightsIssueController } from './rights-issue.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RightsIssue, RiMasterData])],
  controllers: [RightsIssueController],
  providers: [RightsIssueService],
  exports: [RightsIssueService],
})
export class RightsIssueModule {}
