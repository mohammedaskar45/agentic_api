import { Controller, Get, Post, Body, Headers, UseGuards } from '@nestjs/common';
import { IncorporationService } from './incorporation.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller('v1/incorporation')
@UseGuards(JwtAuthGuard)
export class IncorporationController {
  constructor(private readonly incorporationService: IncorporationService) {}

  @Get('status')
  async getStatus(@Headers('x-company-id') companyId: string) {
    return this.incorporationService.getByCompany(companyId);
  }

  @Get('stats')
  async getStats(@Headers('x-company-id') companyId: string) {
    return this.incorporationService.getStats(companyId);
  }

  // Adding specific GET routes for DSC and DIN
  @Get('dsc')
  async getDsc(@Headers('x-company-id') companyId: string) {
    return this.incorporationService.getByCompany(companyId);
  }

  @Get('din')
  async getDin(@Headers('x-company-id') companyId: string) {
    return this.incorporationService.getByCompany(companyId);
  }

  @Get('run')
  async getRun(@Headers('x-company-id') companyId: string) {
    return this.incorporationService.getByCompany(companyId);
  }

  @Get('moa-aoa')
  async getMoaAoa(@Headers('x-company-id') companyId: string) {
    return this.incorporationService.getByCompany(companyId);
  }

  @Get('spice')
  async getSpice(@Headers('x-company-id') companyId: string) {
    return this.incorporationService.getByCompany(companyId);
  }

  @Get('pan-tan')
  async getPanTan(@Headers('x-company-id') companyId: string) {
    return this.incorporationService.getByCompany(companyId);
  }

  @Get('coi') async getCoi(@Headers('x-company-id') companyId: string) { return this.incorporationService.getByCompany(companyId); }
  @Get('bank') async getBank(@Headers('x-company-id') companyId: string) { return this.incorporationService.getByCompany(companyId); }
  @Get('gst') async getGst(@Headers('x-company-id') companyId: string) { return this.incorporationService.getByCompany(companyId); }
  @Get('labor') async getLabor(@Headers('x-company-id') companyId: string) { return this.incorporationService.getByCompany(companyId); }
  @Get('commencement') async getCommencement(@Headers('x-company-id') companyId: string) { return this.incorporationService.getByCompany(companyId); }

  @Post('check-name')
  async checkName(@Body() body: { name: string }) {
    // Simulating MCA Database Search
    // In production, this would call an external MCA API or Scraping service
    const isTaken = ['RELIANCE', 'TATA', 'GOOGLE'].some(n => body.name.includes(n));
    return {
      available: !isTaken,
      message: !isTaken ? 'Name is unique and available' : 'Name is too similar to existing companies',
    };
  }

  @Post('generate-drafts')
  async generateDrafts(@Headers('x-company-id') companyId: string) {
    return this.incorporationService.generateDrafts(companyId);
  }

  @Post('dsc')
  async saveDsc(
    @Headers('x-company-id') companyId: string,
    @Body() dscData: any,
  ) {
    return this.incorporationService.saveDsc(companyId, dscData);
  }

  @Post('din')
  async saveDin(
    @Headers('x-company-id') companyId: string,
    @Body() dinData: any,
  ) {
    return this.incorporationService.saveDin(companyId, dinData);
  }

  @Post('run')
  async saveRun(
    @Headers('x-company-id') companyId: string,
    @Body() runData: any,
  ) {
    return this.incorporationService.saveRun(companyId, runData);
  }

  @Post('moa-aoa')
  async saveMoaAoa(
    @Headers('x-company-id') companyId: string,
    @Body() moaAoaData: any,
  ) {
    return this.incorporationService.saveMoaAoa(companyId, moaAoaData);
  }

  @Post('spice')
  async saveSpice(
    @Headers('x-company-id') companyId: string,
    @Body() spiceData: any,
  ) {
    return this.incorporationService.saveSpice(companyId, spiceData);
  }

  @Post('pan-tan')
  async savePanTan(
    @Headers('x-company-id') companyId: string,
    @Body() panTanData: any,
  ) {
    return this.incorporationService.savePanTan(companyId, panTanData);
  }

  @Post('coi') async saveCoi(@Headers('x-company-id') companyId: string, @Body() data: any) { return this.incorporationService.saveCoi(companyId, data); }
  @Post('bank') async saveBank(@Headers('x-company-id') companyId: string, @Body() data: any) { return this.incorporationService.saveBank(companyId, data); }
  @Post('gst') async saveGst(@Headers('x-company-id') companyId: string, @Body() data: any) { return this.incorporationService.saveGst(companyId, data); }
  @Post('labor') async saveLabor(@Headers('x-company-id') companyId: string, @Body() data: any) { return this.incorporationService.saveLabor(companyId, data); }
  @Post('commencement') async saveCommencement(@Headers('x-company-id') companyId: string, @Body() data: any) { return this.incorporationService.saveCommencement(companyId, data); }
}
