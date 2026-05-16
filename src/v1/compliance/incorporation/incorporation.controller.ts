import { Controller, Get, Post, Body, Headers, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IncorporationService } from './incorporation.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';

const UPLOAD_DIR = 'D:/Malik/agentic_uploads';
if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

@Controller('v1/incorporation')
@UseGuards(JwtAuthGuard)
export class IncorporationController {
  constructor(private readonly incorporationService: IncorporationService) {}

  @Get('status')
  async getStatus(@Headers('x-company-id') companyId: string) {
    return this.incorporationService.getByCompany(companyId);
  }

  @Get('record')
  async getRecord(@Headers('x-company-id') companyId: string) {
    return this.incorporationService.getByCompany(companyId);
  }

  @Get('stats')
  async getStats(@Headers('x-company-id') companyId: string) {
    return this.incorporationService.getStats(companyId);
  }

  @Get('logs')
  async getLogs(@Headers('x-company-id') companyId: string) {
    return this.incorporationService.getLogs(companyId);
  }

  @Get('analysis')
  async getAnalysis(@Headers('x-company-id') companyId: string) {
    const record = await this.incorporationService.getByCompany(companyId);
    return this.incorporationService.validateStakeholders(record.incorporation_id);
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
    return this.incorporationService.getSpice(companyId);
  }

  @Get('pan-tan')
  async getPanTan(@Headers('x-company-id') companyId: string) {
    return this.incorporationService.getPanTan(companyId);
  }

  @Get('coi') async getCoi(@Headers('x-company-id') companyId: string) { return this.incorporationService.getByCompany(companyId); }
  @Get('bank') async getBank(@Headers('x-company-id') companyId: string) { return this.incorporationService.getByCompany(companyId); }
  @Get('gst') async getGst(@Headers('x-company-id') companyId: string) { return this.incorporationService.getGst(companyId); }
  @Get('labor') async getLabor(@Headers('x-company-id') companyId: string) { return this.incorporationService.getLabor(companyId); }
  @Get('auditor') async getAuditor(@Headers('x-company-id') companyId: string) { return this.incorporationService.getByCompany(companyId); }
  @Get('commencement') async getCommencement(@Headers('x-company-id') companyId: string) { return this.incorporationService.getByCompany(companyId); }
  @Get('master-data') async getMasterData(@Headers('x-company-id') companyId: string) { 
    return this.incorporationService.getMasterData(companyId);
  }

  @Get('dropdown-masters')
  async getDropdownMasters() {
    return this.incorporationService.getDropdownMasters();
  }

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
  @Post('auditor') async saveAuditor(@Headers('x-company-id') companyId: string, @Body() data: any) { return this.incorporationService.saveAuditor(companyId, data); }
  @Post('commencement') async saveCommencement(@Headers('x-company-id') companyId: string, @Body() data: any) { return this.incorporationService.saveCommencement(companyId, data); }
  @Post('master-data') async saveMasterData(@Headers('x-company-id') companyId: string, @Body() data: any) { return this.incorporationService.saveMasterData(companyId, data); }
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: UPLOAD_DIR,
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  async upload(
    @Headers('x-company-id') companyId: string, 
    @Body('stepId') stepId: string, 
    @Body('subId') subId: string,
    @UploadedFile() file: Express.Multer.File
  ) { 
    return this.incorporationService.uploadDocument(companyId, parseInt(stepId), { 
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    }, subId); 
  }
  @Post('verify') async verify(@Headers('x-company-id') companyId: string, @Body() body: { stepId: number, subId?: string }) { 
    return this.incorporationService.verifyDocument(companyId, body.stepId, body.subId); 
  }

  @Post('save-meeting')
  async saveMeeting(
    @Headers('x-company-id') companyId: string,
    @Body() meetingData: any,
  ) {
    return await this.incorporationService.saveMeeting(companyId, meetingData);
  }
}
