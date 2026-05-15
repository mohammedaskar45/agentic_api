import { Controller, Get, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { RightsIssueService } from './rights-issue.service';

@Controller('v1/rights-issue')
export class RightsIssueController {
  constructor(private readonly riService: RightsIssueService) {}

  @Get('status')
  async getStatus(@Headers('x-company-id') companyId: string) {
    return this.riService.getStatus(companyId);
  }

  @Post('master-data')
  async saveMasterData(
    @Headers('x-company-id') companyId: string,
    @Body() data: any,
  ) {
    return this.riService.saveMasterData(companyId, data);
  }

  @Post('run-eligibility')
  async runEligibility(@Headers('x-company-id') companyId: string) {
    return this.riService.runEligibility(companyId);
  }

  @Post('generate-drafts')
  async generateDrafts(
    @Headers('x-company-id') companyId: string,
    @Body('stepId') stepId: number,
  ) {
    return this.riService.generateDrafts(companyId, stepId);
  }

  @Post('save-step')
  async saveStep(
    @Headers('x-company-id') companyId: string,
    @Body('stepId') stepId: number,
    @Body('data') data: any,
  ) {
    return this.riService.saveStep(companyId, stepId, data);
  }
}
