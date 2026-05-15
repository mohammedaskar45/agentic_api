import { Controller, Get, Post, Body, Headers, UseGuards, Param } from '@nestjs/common';
import { BuybackService } from './buyback.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller('v1/buyback')
export class BuybackController {
  constructor(private readonly bbService: BuybackService) {}

  @Get('status')
  async getStatus(@Headers('x-company-id') companyId: string) {
    return this.bbService.getStatus(companyId);
  }

  @Post('master-data')
  async saveMasterData(
    @Headers('x-company-id') companyId: string,
    @Body() data: any,
  ) {
    return this.bbService.saveMasterData(companyId, data);
  }

  @Get('eligibility')
  async runEligibility(@Headers('x-company-id') companyId: string) {
    return this.bbService.runEligibility(companyId);
  }

  @Get('drafts/:stepId')
  async getDrafts(
    @Headers('x-company-id') companyId: string,
    @Param('stepId') stepId: string,
  ) {
    return this.bbService.generateDrafts(companyId, parseInt(stepId));
  }

  @Post('save-step/:stepId')
  async saveStep(
    @Headers('x-company-id') companyId: string,
    @Param('stepId') stepId: string,
    @Body() data: any,
  ) {
    return this.bbService.saveStep(companyId, parseInt(stepId), data);
  }
}
