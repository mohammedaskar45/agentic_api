import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incorporation, WorkflowStepStatus } from './entities/incorporation.entity';

@Injectable()
export class IncorporationService {
  constructor(
    @InjectRepository(Incorporation)
    private readonly incorporationRepository: Repository<Incorporation>,
  ) {}

  async getByCompany(companyId: string): Promise<Incorporation> {
    let data = await this.incorporationRepository.findOne({
      where: { company_id: companyId },
    });

    if (!data) {
      data = this.incorporationRepository.create({
        company_id: companyId,
        current_step_id: 1,
        workflow_status: Array.from({ length: 11 }, (_, i) => ({
          id: i + 1,
          status: i === 0 ? 'current' : 'upcoming',
        })) as WorkflowStepStatus[],
      });
      await this.incorporationRepository.save(data);
    }
    return data;
  }

  async getStats(companyId: string): Promise<any> {
    const record = await this.getByCompany(companyId);
    
    // 1. Calculate Time Elapsed (Days)
    const createdDate = new Date(record.created_on || new Date());
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const daysElapsed = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // 2. Pending Tasks
    const pendingTasks = record.workflow_status.filter((s: any) => s.status !== 'completed').length;

    // 3. Vault Files (Simulation: 2 files per completed step)
    const completedSteps = record.workflow_status.filter((s: any) => s.status === 'completed').length;
    const vaultFiles = completedSteps * 2;

    return {
      daysElapsed: daysElapsed || 1,
      pendingTasks: pendingTasks,
      vaultFiles: vaultFiles || 0,
      progress: Math.round((completedSteps / 11) * 100)
    };
  }

  async saveDsc(companyId: string, dscData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);
    record.dsc_data = dscData;
    
    const step = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 1);
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 2);
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 2;
    }

    return await this.incorporationRepository.save(record);
  }

  async saveDin(companyId: string, dinData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);
    record.din_data = dinData;

    const step = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 2);
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 3);
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 3;
    }

    return await this.incorporationRepository.save(record);
  }

  async saveRun(companyId: string, runData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);
    record.run_data = runData;

    const step = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 3);
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 4);
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 4;
    }

    return await this.incorporationRepository.save(record);
  }

  async generateDrafts(companyId: string): Promise<any> {
    const record = await this.getByCompany(companyId);
    const companyName = record.run_data?.proposed_name_1 || '[COMPANY NAME]';
    
    const moa = `MEMORANDUM OF ASSOCIATION OF ${companyName}\n\nI. The name of the company is ${companyName}.\nII. The registered office of the company will be situated in the State of TAMIL NADU.\nIII. (a) The objects to be pursued by the company on its incorporation are:\n   1. To carry on the business of Software development, AI implementation and IT services...\n   2. To provide consultancy in agentic compliance systems...`;
    
    const aoa = `ARTICLES OF ASSOCIATION OF ${companyName}\n\n1. The regulations contained in Table F in Schedule I to the Companies Act, 2013 shall apply to the company.\n2. The company is a Private Company within the meaning of Section 2(68) of the Companies Act, 2013.\n3. The number of members of the company shall be limited to 200.`;

    return {
      moa_content: moa,
      aoa_content: aoa,
    };
  }

  async saveMoaAoa(companyId: string, moaAoaData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);
    record.moa_aoa_data = moaAoaData;

    const step = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 4);
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 5);
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 5;
    }

    return await this.incorporationRepository.save(record);
  }

  async saveSpice(companyId: string, spiceData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);
    record.spice_data = spiceData;

    const step = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 5);
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 6);
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 6;
    }

    return await this.incorporationRepository.save(record);
  }

  async savePanTan(companyId: string, panTanData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);
    record.pan_tan_data = panTanData;

    const step = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 6);
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 7);
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 7;
    }

    return await this.incorporationRepository.save(record);
  }

  async saveCoi(companyId: string, coiData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);
    record.coi_data = coiData;
    const step = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 7);
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 8);
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 8;
    }
    return await this.incorporationRepository.save(record);
  }

  async saveBank(companyId: string, bankData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);
    record.bank_data = bankData;
    const step = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 8);
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 9);
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 9;
    }
    return await this.incorporationRepository.save(record);
  }

  async saveGst(companyId: string, gstData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);
    record.gst_data = gstData;
    const step = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 9);
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 10);
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 10;
    }
    return await this.incorporationRepository.save(record);
  }

  async saveLabor(companyId: string, laborData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);
    record.labor_data = laborData;
    const step = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 10);
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 11);
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 11;
    }
    return await this.incorporationRepository.save(record);
  }

  async saveCommencement(companyId: string, commencementData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);
    record.commencement_data = commencementData;
    const step = record.workflow_status.find((s: WorkflowStepStatus) => s.id === 11);
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      record.workflow_status.find((s: WorkflowStepStatus) => s.id === 11)!.status = 'completed';
    }
    return await this.incorporationRepository.save(record);
  }
}
