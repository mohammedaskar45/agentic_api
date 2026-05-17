/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { PDFParse } from 'pdf-parse';
import {
  Incorporation,
  WorkflowStepStatus,
} from './entities/incorporation.entity';
import { IncorporationLog } from './entities/incorporation-log.entity';
import { MasterDropdown } from './entities/master-dropdown.entity';
import { NIC_CODES, HSN_CODES, PIN_TO_ROC } from './constants/mca-codes';
import { IncMasterData } from './entities/inc-master-data.entity';
import { IncStakeholder } from './entities/inc-stakeholder.entity';
import { IncDsc, IncDin, IncRun } from './entities/inc-steps-basic.entity';
import {
  IncMoaAoa,
  IncSpice,
  IncCoi,
  IncCommencement,
} from './entities/inc-steps-advanced.entity';
import { IncAuditor } from './entities/inc-auditor.entity';
import { IncBank, IncAgile } from './entities/inc-steps-final.entity';
import { AIService } from '../../master/ai/ai.service';

@Injectable()
export class IncorporationService {
  constructor(
    @InjectRepository(Incorporation)
    private readonly incorporationRepository: Repository<Incorporation>,
    @InjectRepository(IncorporationLog)
    private readonly logRepository: Repository<IncorporationLog>,
    @InjectRepository(MasterDropdown)
    private readonly dropdownRepository: Repository<MasterDropdown>,
    private readonly aiService: AIService,
  ) {}

  async getDropdownMasters() {
    return this.dropdownRepository.find({
      where: { is_active: true },
      order: { category: 'ASC', label: 'ASC' },
    });
  }

  private async logEvent(
    companyId: string,
    eventType: string,
    description: string,
    metadata?: any,
  ) {
    const log = this.logRepository.create({
      company_id: companyId,
      event_type: eventType,
      description,
      metadata,
    });
    await this.logRepository.save(log);
  }

  async getLogs(companyId: string) {
    return this.logRepository.find({
      where: { company_id: companyId },
      order: { created_at: 'DESC' },
    });
  }

  async getByCompany(companyId: string): Promise<Incorporation> {
    let data = await this.incorporationRepository.findOne({
      where: { company_id: companyId },
      relations: [
        'master_data',
        'stakeholders',
        'dsc_data',
        'din_data',
        'run_data',
        'moa_aoa_data',
        'spice_data',
        'coi_data',
        'bank_data',
        'agile_data',
        'commencement_data',
        'auditor_data',
      ],
    });

    if (!data) {
      data = this.incorporationRepository.create({
        company_id: companyId,
        current_step_id: 0,
        workflow_status: Array.from({ length: 10 }, (_, i) => ({
          id: i,
          status: i === 0 ? 'current' : 'upcoming',
        })) as WorkflowStepStatus[],
      });
      await this.incorporationRepository.save(data);
      await this.logEvent(
        companyId,
        'RECORD_CREATED',
        'Initial incorporation record created with 12-step workflow.',
      );
    } else {
      // Auto-fix / Migration: Ensure 10 steps and strict exclusivity
      const currentId = data.current_step_id || 0;
      let changed = false;

      // Ensure 10 steps
      if (data.workflow_status.length !== 10) {
        data.workflow_status = Array.from({ length: 10 }, (_, i) => ({
          id: i,
          status: i < currentId ? 'completed' : (i === currentId ? 'current' : 'upcoming'),
        })) as WorkflowStepStatus[];
        changed = true;
      } else {
        // Fix statuses based on currentId
        data.workflow_status.forEach((s: WorkflowStepStatus) => {
          const expectedStatus = s.id < currentId ? 'completed' : (s.id === currentId ? 'current' : 'upcoming');
          if (s.status !== expectedStatus) {
            s.status = expectedStatus;
            changed = true;
          }
        });
      }

      if (changed) {
        await this.incorporationRepository.save(data);
      }
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
    const pendingTasks = record.workflow_status.filter(
      (s: any) => s.status !== 'completed',
    ).length;

    // 3. Vault Files (Simulation: 2 files per completed step)
    const completedSteps = record.workflow_status.filter(
      (s: any) => s.status === 'completed',
    ).length;
    const vaultFiles = completedSteps * 2;

    const totalSteps = record.workflow_status.length || 12;

    return {
      daysElapsed: daysElapsed || 1,
      pendingTasks: pendingTasks,
      vaultFiles: vaultFiles || 0,
      progress: Math.round((completedSteps / totalSteps) * 100),
      current_step_id: record.current_step_id,
      deadlines: this.getComplianceDeadlines(record),
    };
  }

  public getComplianceDeadlines(record: Incorporation) {
    const coiDate = (record.coi_data?.registration_date || record.coi_data?.incorporation_date)
      ? new Date(record.coi_data.registration_date || record.coi_data.incorporation_date)
      : null;

    if (!coiDate) return [];

    const auditorData = record.auditor_data;
    const appointmentDate = auditorData?.appointment_date ? new Date(auditorData.appointment_date) : null;

    const deadlines = [
      {
        task: 'First Board Meeting',
        days_limit: 30,
        deadline: new Date(coiDate.getTime() + 30 * 24 * 60 * 60 * 1000),
        section: 'Section 173',
      },
      {
        task: 'File ADT-1 with ROC',
        days_limit: 15,
        deadline: appointmentDate 
          ? new Date(appointmentDate.getTime() + 15 * 24 * 60 * 60 * 1000)
          : new Date(coiDate.getTime() + 45 * 24 * 60 * 60 * 1000), // Estimated 30 (BM) + 15 (Filing)
        section: 'Section 139(6)',
      },
      {
        task: 'File INC-20A (Commencement)',
        days_limit: 180,
        deadline: new Date(coiDate.getTime() + 180 * 24 * 60 * 60 * 1000),
        section: 'Section 10A',
      },
    ];

    return deadlines.map((d) => {
      const now = new Date();
      const remainingDays = Math.ceil(
        (d.deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      let status = 'green';
      if (remainingDays <= 7) status = 'red';
      else if (remainingDays <= 14) status = 'amber';

      return {
        ...d,
        remaining_days: remainingDays,
        status,
      };
    });
  }

  async saveMasterData(companyId: string, data: any): Promise<any> {
    const record = await this.getByCompany(companyId);

    // 1. Capital Validation
    const authCap = Number(data.company?.authorised_capital || 0);
    const paidCap = Number(data.company?.paid_up_capital || 0);
    if (paidCap > authCap) {
      throw new Error(
        'Paid-up capital cannot be greater than Authorised capital.',
      );
    }

    // 2. Minimum Directors Validation
    const minDirectors: Record<string, number> = {
      pvt_ltd: 2,
      opc: 1,
      public_ltd: 3,
      section_8: 2,
    };

    const companyType = data.company?.company_type || 'pvt_ltd';
    const minCount = minDirectors[companyType] || 0;

    if (data.stakeholders && data.stakeholders.length < minCount) {
      throw new Error(
        `Minimum ${minCount} directors/subscribers are required for ${companyType}.`,
      );
    }

    // Save IncMasterData (Update if exists)
    const masterData =
      record.master_data ||
      this.incorporationRepository.manager.create(IncMasterData, {
        incorporation_id: record.incorporation_id,
      });

    Object.assign(masterData, { 
      ...data.company, 
      ...data.professionals,
      ...data.witness,
      official_email: data.company?.official_email
    });

    record.master_data = await this.incorporationRepository.manager.save(
      IncMasterData,
      masterData,
    );

    // 3. Save IncStakeholders (Upsert Logic)
    if (data.stakeholders && Array.isArray(data.stakeholders)) {
      const existingStakeholders = record.stakeholders || [];
      const stakeholderIdsInRequest = data.stakeholders
        .map((s: any) => s.id)
        .filter(Boolean);

      // Delete stakeholders not in the request
      if (existingStakeholders.length > 0) {
        const toDelete = existingStakeholders.filter(
          (s) => !stakeholderIdsInRequest.includes(s.inc_stakeholder_id),
        );
        if (toDelete.length > 0) {
          await this.incorporationRepository.manager.delete(
            IncStakeholder,
            toDelete.map((s) => s.inc_stakeholder_id),
          );
        }
      }

      // Update or Create
      const stakeholderPromises = data.stakeholders.map(async (sData: any) => {
        let stakeholder = sData.id
          ? existingStakeholders.find((s) => s.inc_stakeholder_id === sData.id)
          : null;

        if (!stakeholder) {
          stakeholder = this.incorporationRepository.manager.create(
            IncStakeholder,
            {
              incorporation_id: record.incorporation_id,
            },
          );
        }

        Object.assign(stakeholder, {
          ...sData,
          incorporation_id: record.incorporation_id,
        });

        return await this.incorporationRepository.manager.save(
          IncStakeholder,
          stakeholder,
        );
      });

      record.stakeholders = await Promise.all(stakeholderPromises);
    }

    const step = record.workflow_status.find(
      (s: WorkflowStepStatus) => s.id === 0,
    );
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find(
        (s: WorkflowStepStatus) => s.id === 1,
      );
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 1;
    }

    await this.logEvent(
      companyId,
      'STEP_COMPLETED',
      'Step 0: Master Data Profiling completed.',
    );
    const updatedRecord = await this.getByCompany(companyId);
    return this.formatMasterDataResponse(updatedRecord);
  }

  async getMasterData(companyId: string) {
    const record = await this.getByCompany(companyId);
    return this.formatMasterDataResponse(record);
  }

  public formatMasterDataResponse(record: Incorporation) {
    if (!record.master_data) return null;

    const {
      proposed_name,
      alternative_name,
      cin,
      company_type,
      main_objects,
      ancillary_objects,
      authorised_capital,
      paid_up_capital,
      face_value,
      state,
      registered_address,
      official_email,
      police_station,
      jurisdiction,
      ca_cs_name,
      membership_no,
      auditor_name,
      auditor_frn,
      auditor_address,
      auditor_email,
      bank_name,
      bank_account,
      witness_name,
      witness_father_name,
      witness_address,
      witness_occupation,
    } = record.master_data;

    return {
      company: {
        proposed_name,
        alternative_name,
        cin,
        company_type,
        main_objects,
        ancillary_objects,
        authorised_capital,
        paid_up_capital,
        face_value,
        state,
        registered_address,
        official_email,
        bank_name,
        police_station,
        jurisdiction,
      },
      professionals: {
        ca_cs_name,
        membership_no,
        auditor_name,
        auditor_frn,
        auditor_address,
        auditor_email,
        bank_name,
        bank_account,
      },
      witness: {
        witness_name,
        witness_father_name,
        witness_address,
        witness_occupation,
      },
      stakeholders: (record.stakeholders || []).map((s) => ({
        ...s,
        id: s.inc_stakeholder_id, // Alias for frontend compatibility
      })),
    };
  }

  async getSpice(companyId: string) {
    const record = await this.getByCompany(companyId);
    const masterData = record.master_data;
    const spice = record.spice_data;

    return {
      spice_data: spice
        ? {
            ...spice,
            type_of_company: masterData?.company_type || 'pvt_ltd',
          }
        : {
            submission_status: 'pending',
            type_of_company: masterData?.company_type || 'pvt_ltd',
          },
    };
  }

  async getPanTan(companyId: string) {
    const record = await this.getByCompany(companyId);
    const coi = record.coi_data;

    return {
      pan_tan_data: {
        pan_number: coi?.pan || '',
        pan_area_code: coi?.pan_area_code || '',
        pan_ao_type: coi?.pan_ao_type || '',
        pan_range_code: coi?.pan_range_code || '',
        pan_ao_no: coi?.pan_ao_no || '',
        tan_number: coi?.tan || '',
        tan_area_code: coi?.tan_area_code || '',
        tan_ao_type: coi?.tan_ao_type || '',
        tan_range_code: coi?.tan_range_code || '',
        tan_ao_no: coi?.tan_ao_no || '',
        allotment_date: coi?.registration_date || '',
        status: coi ? 'allotted' : 'pending',
      },
    };
  }

  async getGst(companyId: string) {
    const record = await this.getByCompany(companyId);
    return {
      gst_data: record.agile_data
        ? {
            ...record.agile_data,
            registration_date: record.agile_data.created_on
              ?.toISOString()
              .split('T')[0],
          }
        : null,
    };
  }

  async getLabor(companyId: string) {
    const record = await this.getByCompany(companyId);
    return {
      labor_data: record.agile_data
        ? {
            ...record.agile_data,
            registration_date: record.agile_data.created_on
              ?.toISOString()
              .split('T')[0],
          }
        : null,
    };
  }

  async saveDsc(companyId: string, dscData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);

    const dsc =
      record.dsc_data ||
      this.incorporationRepository.manager.create(IncDsc, {
        incorporation_id: record.incorporation_id,
      });
    
    // dscData should contain { directors: [...] }
    if (dscData.directors) {
      dsc.directors = dscData.directors;
    }
    
    record.dsc_data = await this.incorporationRepository.manager.save(
      IncDsc,
      dsc,
    );

    const step = record.workflow_status.find(
      (s: WorkflowStepStatus) => s.id === 1,
    );
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find(
        (s: WorkflowStepStatus) => s.id === 2,
      );
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 2;
    }

    await this.logEvent(
      companyId,
      'STEP_COMPLETED',
      'Step 1: Digital Signature Application completed.',
    );
    return await this.incorporationRepository.save(record);
  }

  async saveDin(companyId: string, dinData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);

    const din =
      record.din_data ||
      this.incorporationRepository.manager.create(IncDin, {
        incorporation_id: record.incorporation_id,
      });
    Object.assign(din, {
      directors: dinData.directors || [],
      din_number: dinData.din_number,
    });
    record.din_data = await this.incorporationRepository.manager.save(
      IncDin,
      din,
    );

    const step = record.workflow_status.find(
      (s: WorkflowStepStatus) => s.id === 2,
    );
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find(
        (s: WorkflowStepStatus) => s.id === 3,
      );
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 3;
    }

    return await this.incorporationRepository.save(record);
  }

  async saveRun(companyId: string, runData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);

    const run =
      record.run_data ||
      this.incorporationRepository.manager.create(IncRun, {
        incorporation_id: record.incorporation_id,
      });
    Object.assign(run, {
      proposed_name_1: runData.proposed_name || 'PENDING',
      proposed_name_2: runData.proposed_name_2 || '',
      nic_code: runData.nic_code,
      nic_code_id: runData.nic_code_id || null,
      sector_category: runData.sector_category,
      trademark_confirmed: runData.trademark_confirmed || false,
      tm_certificate_ref: runData.tm_certificate_ref || null,
      significance: runData.significance,
      objectives_summary: runData.main_objects || runData.significance,
    });
    record.run_data = await this.incorporationRepository.manager.save(
      IncRun,
      run,
    );

    const step = record.workflow_status.find(
      (s: WorkflowStepStatus) => s.id === 3,
    );
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find(
        (s: WorkflowStepStatus) => s.id === 4,
      );
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 4;
    }

    return await this.incorporationRepository.save(record);
  }

  async uploadDocument(
    companyId: string,
    stepId: number,
    fileMetadata: any,
    subId?: string,
  ): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);
    if (!record.step_uploads) record.step_uploads = {};
    
    const key = subId ? `${stepId}_${subId}` : `${stepId}`;

    record.step_uploads[key] = {
      ...fileMetadata,
      status: 'pending',
      sub_id: subId,
    };

    await this.logEvent(
      companyId,
      'DOC_UPLOADED',
      `Document uploaded for Step ${stepId}${subId ? ` (Stakeholder: ${subId})` : ''}: ${fileMetadata.filename}`,
      { filename: fileMetadata.filename, subId },
    );
    return await this.incorporationRepository.save(record);
  }

  async verifyDocument(
    companyId: string,
    stepId: number,
    subId?: string,
  ): Promise<any> {
    const record = await this.getByCompany(companyId);
    const key = subId ? `${stepId}_${subId}` : `${stepId}`;
    
    if (!record.step_uploads || !record.step_uploads[key]) {
      throw new Error('No document found to verify.');
    }

    const upload = record.step_uploads[key];
    const filePath = upload.path;

    if (!fs.existsSync(filePath)) {
      throw new Error('File not found on server.');
    }

    try {
      // 1. Read PDF Content
      const dataBuffer = fs.readFileSync(filePath);
      const parser = new PDFParse({ data: dataBuffer });
      const data = await parser.getText();
      const content = data.text.toUpperCase();

      // 2. Get Target Data for comparison
      let targetName = '';
      let targetPan = '';
      let targetDob = '';

      if (stepId === 1 && subId) {
        const stakeholder = record.stakeholders?.find(s => s.inc_stakeholder_id === subId);
        if (stakeholder) {
          targetName = stakeholder.full_name.toUpperCase();
          targetPan = stakeholder.pan.toUpperCase();
          targetDob = stakeholder.dob; // Format: YYYY-MM-DD
        }
      }

      // 3. Validation Logic
      const errors = [];
      if (targetName && !content.includes(targetName)) {
        errors.push(`Name Mismatch: Expected "${targetName}" not found in document.`);
      }
      if (targetPan && !content.includes(targetPan)) {
        errors.push(`PAN Mismatch: Expected "${targetPan}" not found in document.`);
      }
      // Simple DOB check (looking for parts of it)
      if (targetDob) {
        const dobParts = targetDob.split('-'); // [2026, 05, 16]
        const hasYear = content.includes(dobParts[0]);
        const hasDay = content.includes(dobParts[2]);
        if (!hasYear || !hasDay) {
          errors.push(`DOB Mismatch: Expected date "${targetDob}" not found.`);
        }
      }

      if (errors.length > 0) {
        upload.status = 'failed';
        upload.verification_result = 'MISMATCH';
        upload.errors = errors;
        await this.incorporationRepository.save(record);
        return { success: false, errors };
      }

      // 4. Success
      upload.status = 'verified';
      upload.verified_at = new Date();
      upload.verification_result = 'MATCHED';
      
      await this.logEvent(
        companyId,
        'DOC_VERIFIED',
        `AI Content Verification passed for Step ${stepId}: ${upload.filename}`,
        { stepId, subId, filename: upload.filename },
      );

      await this.incorporationRepository.save(record);
      return { success: true };
    } catch (error) {
      console.error('PDF Parse Error:', error);
      throw new Error('Failed to parse document content.');
    }
  }

  async saveMeeting(companyId: string, meetingData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);
    if (!record.metadata) record.metadata = {};

    record.metadata.first_board_meeting = {
      date: meetingData.date,
      time: meetingData.time,
      venue: meetingData.venue || record.master_data?.registered_address,
      scheduled_at: new Date(),
    };

    const step = record.workflow_status.find(
      (s: WorkflowStepStatus) => s.id === 7,
    );
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find(
        (s: WorkflowStepStatus) => s.id === 8,
      );
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 8;
    }

    return await this.incorporationRepository.save(record);
  }

  async generateDrafts(companyId: string): Promise<any[]> {
    const record = await this.getByCompany(companyId);
    if (!record.master_data) {
      throw new Error('Master Data missing. Please complete Step 0 first.');
    }

    const company = record.master_data;
    const stakeholders = record.stakeholders || [];
    const companyName = (company.proposed_name || 'PROPOSED COMPANY NAME').toUpperCase();
    const state = company.state || 'Tamil Nadu';
    const regAddress = company.registered_address || '[Registered Office Address]';
    
    // Meeting Details from Metadata (The Automation)
    const meeting = record.metadata?.first_board_meeting || {};
    const mDate = meeting.date || '________';
    const mTime = meeting.time || '________';
    const mVenue = meeting.venue || regAddress;

    // Fix Share Math: Ensure whole numbers
    const totalCapital = Number(company.authorised_capital) || 100000;
    const faceValue = Number(company.face_value) || 10;
    const totalShares = Math.floor(totalCapital / faceValue);
    
    const paidUpCapital = Number(company.paid_up_capital) || 10000;
    const paidUpShares = Math.floor(paidUpCapital / faceValue);

    // AI DRAFTING - The Section 13.2 Logic
    const { main_objects, ancillary_objects } = await this.aiService.generateMoAObjects(
      company.main_objects,
      company.company_type
    );
    const aoa_regulations = await this.aiService.generateAoARegulations(company.company_type);

    // Prepare Subscriber list string for MoA/AoA
    const subscriberList = stakeholders.map((s, idx) => `${idx + 1}. ${s.full_name.toUpperCase()}`).join('\n');
    const allNames = stakeholders.map(s => s.full_name.toUpperCase()).join(', ');

    const documents: any[] = [
      // 1. Constitutional Documents (2)
      {
        id: 'moa',
        title: 'Memorandum of Association (MoA)',
        category: 'Constitutional',
        content: `THE COMPANIES ACT, 2013\n(Company Limited by Shares)\n\nMEMORANDUM OF ASSOCIATION OF\n${companyName}\n\nI. The name of the company is ${companyName}.\n\nII. The registered office of the company will be situated in the State of ${state}.\n\nIII. (a) The objects to be pursued by the company on its incorporation are:\n${String(main_objects || '').replace(/^To carry on the business of/i, '').trim()}\n\n(b) Matters necessary for furtherance of the objects:\n${ancillary_objects}\n\nIV. The liability of the member(s) is limited.\n\nV. The share capital of the company is Rs. ${totalCapital.toLocaleString('en-IN')} divided into ${totalShares.toLocaleString('en-IN')} Equity Shares of Rs. ${faceValue} each.\n\nLIST OF SUBSCRIBERS:\n${subscriberList}`,
      },
      {
        id: 'aoa',
        title: 'Articles of Association (AoA)',
        category: 'Constitutional',
        content: `THE COMPANIES ACT, 2013\n(Company Limited by Shares)\n\nARTICLES OF ASSOCIATION OF\n${companyName}\n\n${aoa_regulations}\n\nSUBSCRIBERS:\n${allNames}`,
      },
    ];

    // 2. Pre-Incorporation Documents (Per Stakeholder)
    stakeholders.forEach(s => {
      const name = s.full_name.toUpperCase();
      documents.push({
        id: `dir2_${s.inc_stakeholder_id}`,
        title: `DIR-2: ${s.full_name}`,
        category: 'Pre-Incorporation',
        content: `FORM DIR-2\n(Consent to act as Director)\n\nTo,\nThe Board of Directors,\n${companyName}\n\nI, ${name}, hereby give my consent to act as director of ${companyName} pursuant to Section 152(5) of the Companies Act, 2013.\n\nPAN: ${s.pan}\nDIN/Passport: ${s.existing_din || 'Applied For'}\nAddress: ${s.residential_address}`,
      });
      
      documents.push({
        id: `inc9_${s.inc_stakeholder_id}`,
        title: `INC-9: ${s.full_name}`,
        category: 'Pre-Incorporation',
        content: `FORM INC-9\n(Declaration by Subscriber/Director)\n\nI, ${name}, do hereby solemnly declare that I have not been convicted of any offence in connection with the promotion or management of any company.\n\nDate: ${new Date().toLocaleDateString()}`,
      });
    });

    documents.push({
      id: 'noc_office',
      title: 'NOC for Registered Office',
      category: 'Pre-Incorporation',
      content: `NO OBJECTION CERTIFICATE\n\nI, ________________, owner of ${regAddress}, hereby declare no objection to ${companyName} using the premises as its Registered Office.`,
    });

    // 3. Board Meeting Documents
    documents.push({
      id: 'bm_notice',
      title: 'Notice of First Board Meeting',
      category: 'Board Meeting',
      content: `NOTICE TO ALL DIRECTORS\n\nNotice is hereby given that the first Board Meeting of ${companyName} will be held on ${mDate} at ${mTime} at ${mVenue}.\n\nDirectors: ${allNames}`,
    });
    
    documents.push({
      id: 'bm_agenda',
      title: 'Agenda of First Board Meeting',
      category: 'Board Meeting',
      content: `AGENDA\n1. Appoint Chairman\n2. Note COI\n3. Appoint Auditors\n4. Open Bank Account`,
    });

    documents.push({
      id: 'bm_minutes',
      title: 'Minutes of First Board Meeting',
      category: 'Board Meeting',
      content: `MINUTES OF THE FIRST BOARD MEETING OF ${companyName}\n\nHELD ON: ${mDate}\nTIME: ${mTime}\nVENUE: ${mVenue}\n\nPRESENT: ${allNames}\n\nCHAIRMAN: ${stakeholders[0]?.full_name.toUpperCase()} was elected Chairman.`,
    });

    documents.push({
      id: 'br_bank',
      title: 'Board Resolution: Bank Account Opening',
      category: 'Board Meeting',
      content: `RESOLUTION\n\n"RESOLVED THAT a Current Account be opened with ${company.bank_name || 'Bank'} and ${stakeholders[0]?.full_name.toUpperCase()} be authorised to operate the same."`,
    });

    // 4. Auditor Documents (Single Set)
    documents.push({
      id: 'br_auditor',
      title: 'Board Resolution: Auditor Appointment',
      category: 'Auditor',
      content: `RESOLUTION\n\n"RESOLVED THAT M/s ${company.auditor_name} be appointed as First Auditors."`,
    });
    
    documents.push({
      id: 'auditor_consent',
      title: 'Auditor Consent Letter',
      category: 'Auditor',
      content: `CONSENT\n\nWe, M/s ${company.auditor_name}, give our consent to be appointed as auditors of ${companyName}.`,
    });

    documents.push({
      id: 'auditor_intimation',
      title: 'Intimation to Auditor',
      category: 'Auditor',
      content: `INTIMATION\n\nWe inform you that the Board has appointed your firm as Auditors of ${companyName}.`,
    });

    documents.push({
      id: 'adt1_draft',
      title: 'ADT-1 Pre-fill Content',
      category: 'Auditor',
      content: `DRAFT ADT-1\nAuditor: ${company.auditor_name}\nPAN: ${company.auditor_frn}`,
    });

    // 5. Commencement Documents
    documents.push({
      id: 'br_commencement',
      title: 'Board Resolution: Commencement of Business',
      category: 'Commencement',
      content: `RESOLUTION\n\n"RESOLVED THAT the Board takes note that the subscription money of Rs. ${paidUpCapital} has been received."`,
    });
    
    documents.push({
      id: 'inc20a_decl',
      title: 'Declaration for INC-20A',
      category: 'Commencement',
      content: `DECLARATION\n\nI, ${stakeholders[0]?.full_name.toUpperCase()}, verify that the subscribers have paid the share value.`,
    });

    documents.push({
      id: 'prof_cert_20a',
      title: 'Professional Certificate for INC-20A',
      category: 'Commencement',
      content: `CERTIFICATE\n\nI, ${company.ca_cs_name}, certify that the subscription money has been received by ${companyName}.`,
    });

    // 6. Other Statutory (Per Subscriber for Share Certs)
    stakeholders.forEach(s => {
      documents.push({
        id: `share_cert_${s.inc_stakeholder_id}`,
        title: `Share Certificate: ${s.full_name}`,
        category: 'Other Statutory',
        content: `SHARE CERTIFICATE\n\nThis is to certify that ${s.full_name.toUpperCase()} is the holder of shares in ${companyName}.`,
      });
    });

    documents.push({
      id: 'br_seal',
      title: 'Board Resolution: Adoption of Common Seal',
      category: 'Other Statutory',
      content: `RESOLUTION\n\n"RESOLVED THAT the Common Seal be adopted."`,
    });

    return documents;
  }




  async saveMoaAoa(companyId: string, moaAoaData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);

    const moaAoa =
      record.moa_aoa_data ||
      this.incorporationRepository.manager.create(IncMoaAoa, {
        incorporation_id: record.incorporation_id,
      });
    Object.assign(moaAoa, {
      moa_content: moaAoaData.moa_content || 'Standard MoA',
      aoa_content: moaAoaData.aoa_content || 'Standard AoA',
    });
    record.moa_aoa_data = await this.incorporationRepository.manager.save(
      IncMoaAoa,
      moaAoa,
    );

    const step = record.workflow_status.find(
      (s: WorkflowStepStatus) => s.id === 4,
    );
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find(
        (s: WorkflowStepStatus) => s.id === 5,
      );
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 5;
    }

    return await this.incorporationRepository.save(record);
  }

  async saveSpice(companyId: string, spiceData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);

    // Workflow Dependency Check
    const runStep = record.workflow_status.find((s: any) => s.id === 3);
    if (!runStep || runStep.status !== 'completed') {
      throw new Error(
        'Name Reservation (Step 3) must be completed before filing SPICe+.',
      );
    }

    const spice =
      record.spice_data ||
      this.incorporationRepository.manager.create(IncSpice, {
        incorporation_id: record.incorporation_id,
      });
    Object.assign(spice, {
      submission_status: spiceData.submission_status,
      mca_reference_id: spiceData.mca_reference_id,
      filing_status: spiceData.submission_status || spiceData.filing_status,
      srn_number: spiceData.mca_reference_id || spiceData.srn_number,
      is_small_company: spiceData.is_small_company ?? true,
      inc9_declaration_accepted: spiceData.inc9_declaration_accepted || false,
    });
    record.spice_data = await this.incorporationRepository.manager.save(
      IncSpice,
      spice,
    );

    const step = record.workflow_status.find(
      (s: WorkflowStepStatus) => s.id === 5,
    );
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find(
        (s: WorkflowStepStatus) => s.id === 6,
      );
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 6;
    }

    return await this.incorporationRepository.save(record);
  }

  async savePanTan(companyId: string, panTanData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);

    // PAN/TAN are officially part of the COI record in our architecture
    const coi =
      record.coi_data ||
      this.incorporationRepository.manager.create(IncCoi, {
        incorporation_id: record.incorporation_id,
      });

    Object.assign(coi, {
      pan: panTanData.pan_number,
      pan_area_code: panTanData.pan_area_code,
      pan_ao_type: panTanData.pan_ao_type,
      pan_range_code: panTanData.pan_range_code,
      pan_ao_no: panTanData.pan_ao_no,
      tan: panTanData.tan_number,
      tan_area_code: panTanData.tan_area_code,
      tan_ao_type: panTanData.tan_ao_type,
      tan_range_code: panTanData.tan_range_code,
      tan_ao_no: panTanData.tan_ao_no,
      registration_date: panTanData.allotment_date,
    });

    record.coi_data = await this.incorporationRepository.manager.save(
      IncCoi,
      coi,
    );

    const step = record.workflow_status.find(
      (s: WorkflowStepStatus) => s.id === 6,
    );
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find(
        (s: WorkflowStepStatus) => s.id === 7,
      );
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 7;
    }

    return await this.incorporationRepository.save(record);
  }

  async saveCoi(companyId: string, coiData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);

    const coi =
      record.coi_data ||
      this.incorporationRepository.manager.create(IncCoi, {
        incorporation_id: record.incorporation_id,
      });
    Object.assign(coi, {
      coi_number: coiData.coi_number,
      registration_date: coiData.registration_date,
      cin: coiData.coi_number || coiData.cin,
      incorporation_date:
        coiData.registration_date || coiData.incorporation_date,
      pan: coiData.pan,
      tan: coiData.tan,
    });
    record.coi_data = await this.incorporationRepository.manager.save(
      IncCoi,
      coi,
    );

    const step = record.workflow_status.find(
      (s: WorkflowStepStatus) => s.id === 7,
    );
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find(
        (s: WorkflowStepStatus) => s.id === 8,
      );
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 8;
    }
    return await this.incorporationRepository.save(record);
  }

  async saveBank(companyId: string, bankData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);

    const bank =
      record.bank_data ||
      this.incorporationRepository.manager.create(IncBank, {
        incorporation_id: record.incorporation_id,
      });
    Object.assign(bank, {
      bank_name: bankData.bank_name,
      account_number: bankData.account_number || null,
      ifsc_code: bankData.ifsc_code || null,
      branch_name: bankData.branch_name,
      branch: bankData.branch_name || bankData.branch || 'Main Branch',
      account_type: bankData.account_type,
      application_status: bankData.application_status || 'pending',
    });
    record.bank_data = await this.incorporationRepository.manager.save(
      IncBank,
      bank,
    );

    const step = record.workflow_status.find(
      (s: WorkflowStepStatus) => s.id === 8,
    );
    if (step && step.status !== 'completed' && bankData.application_status === 'active') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find(
        (s: WorkflowStepStatus) => s.id === 9,
      );
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 9;
    }
    return await this.incorporationRepository.save(record);
  }

  async saveGst(companyId: string, gstData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);

    const agile =
      record.agile_data ||
      this.incorporationRepository.manager.create(IncAgile, {
        incorporation_id: record.incorporation_id,
      });
    Object.assign(agile, {
      gst_required: true,
      gstin: gstData.gstin,
      state_jurisdiction: gstData.state_jurisdiction,
      center_jurisdiction: gstData.center_jurisdiction,
      hsn_sac_code: gstData.hsn_sac_code,
      nature_of_possession_detailed: gstData.nature_of_possession_detailed,
      taxpayer_type: gstData.taxpayer_type,
      prof_tax_required: gstData.prof_tax_required || false,
      shops_establishment_required:
        gstData.shops_establishment_required || false,
    });
    record.agile_data = await this.incorporationRepository.manager.save(
      IncAgile,
      agile,
    );

    const step = record.workflow_status.find(
      (s: WorkflowStepStatus) => s.id === 6,
    );
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find(
        (s: WorkflowStepStatus) => s.id === 7,
      );
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 7;
    }
    return await this.incorporationRepository.save(record);
  }

  async saveLabor(companyId: string, laborData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);

    const agile =
      record.agile_data ||
      this.incorporationRepository.manager.create(IncAgile, {
        incorporation_id: record.incorporation_id,
      });
    Object.assign(agile, {
      epfo_required: true,
      esic_required: true,
      epfo_number: laborData.epfo_number,
      esic_number: laborData.esic_number,
      establishment_id: laborData.establishment_id,
    });
    record.agile_data = await this.incorporationRepository.manager.save(
      IncAgile,
      agile,
    );

    const step = record.workflow_status.find(
      (s: WorkflowStepStatus) => s.id === 6,
    );
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find(
        (s: WorkflowStepStatus) => s.id === 7,
      );
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 7;
    }
    return await this.incorporationRepository.save(record);
  }
  async saveAuditor(companyId: string, auditorData: any): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);

    const auditor =
      record.auditor_data ||
      this.incorporationRepository.manager.create(IncAuditor, {
        incorporation_id: record.incorporation_id,
      });

    Object.assign(auditor, {
      auditor_name: auditorData.auditor_name,
      auditor_frn: auditorData.auditor_frn,
      auditor_address: auditorData.auditor_address,
      auditor_email: auditorData.auditor_email,
      appointment_date: auditorData.appointment_date,
      consent_received: auditorData.consent_received ?? true,
      adt1_filed: auditorData.adt1_filed || false,
      adt1_srn: auditorData.adt1_srn,
    });

    record.auditor_data = await this.incorporationRepository.manager.save(
      IncAuditor,
      auditor,
    );

    const step = record.workflow_status.find(
      (s: WorkflowStepStatus) => s.id === 8,
    );
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find(
        (s: WorkflowStepStatus) => s.id === 9,
      );
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 9;
    }

    await this.logEvent(
      companyId,
      'STEP_COMPLETED',
      'Step 11: First Auditor Appointment completed.',
    );
    return await this.incorporationRepository.save(record);
  }


  async saveCommencement(
    companyId: string,
    commencementData: any,
  ): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);

    const commencement =
      record.commencement_data ||
      this.incorporationRepository.manager.create(IncCommencement, {
        incorporation_id: record.incorporation_id,
      });
    Object.assign(commencement, {
      subscription_paid: commencementData.subscription_paid || true,
      bank_statement_ref: commencementData.bank_statement_ref,
      status: 'completed',
    });
    record.commencement_data = await this.incorporationRepository.manager.save(
      IncCommencement,
      commencement,
    );

    const step = record.workflow_status.find(
      (s: WorkflowStepStatus) => s.id === 9,
    );
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      record.current_step_id = 10;
    }
    return await this.incorporationRepository.save(record);
  }

  // Helper for Stamp Duty Estimation (Statutory Compliance)
  public estimateStampDuty(state: string, authorisedCapital: number): number {
    const capital = Number(authorisedCapital);
    let duty = 0;

    switch (state?.toLowerCase()) {
      case 'tamil nadu':
        duty = capital * 0.005; // 0.5%
        break;
      case 'maharashtra':
        duty = capital * 0.001; // 0.1%
        break;
      case 'delhi':
        duty = capital * 0.0015;
        break;
      default:
        duty = capital * 0.002; // Default 0.2%
    }

    return Math.max(duty, 500); // Minimum 500
  }

  async getSuggestedCodes(objective: string) {
    const query = objective.toLowerCase();
    const suggestedNic = NIC_CODES.filter(n => 
      n.description.toLowerCase().includes(query) || n.industry.toLowerCase().includes(query)
    );
    const suggestedHsn = HSN_CODES.filter(h => 
      h.description.toLowerCase().includes(query)
    );

    return {
      nic: suggestedNic.slice(0, 5),
      hsn: suggestedHsn.slice(0, 5),
    };
  }

  async getJurisdictionByPin(pin: string) {
    const prefix = pin.substring(0, 2);
    return (PIN_TO_ROC as any)[prefix] || { city: 'Unknown', roc: 'Please select ROC manually', state: 'Unknown' };
  }

  async validateStakeholders(incorporationId: string) {
    const record = await this.incorporationRepository.findOne({
      where: { incorporation_id: incorporationId },
      relations: ['stakeholders', 'master_data'],
    });

    if (!record) return [];

    const reports: any[] = [];
    const stakeholders = record.stakeholders || [];

    // 1. Nationality/Apostille check
    stakeholders.forEach(s => {
      if (s.nationality !== 'Indian') {
        reports.push({
          stakeholder: s.full_name,
          requirement: 'APOSTILLE_REQUIRED',
          message: 'Foreign national documents must be apostilled in their home country (Rule 13).',
        });
      }
    });

    // 2. Minimum Stakeholders (for Pvt Ltd)
    if (stakeholders.length < 2) {
      reports.push({
        stakeholder: 'Company Structure',
        requirement: 'MIN_2_SUBSCRIBERS',
        message: 'A Private Limited company requires a minimum of 2 subscribers/directors.',
      });
    }

    // 3. Resident Director Check
    const hasResident = stakeholders.some(s => s.nationality === 'Indian');
    if (!hasResident && stakeholders.length > 0) {
      reports.push({
        stakeholder: 'Board Composition',
        requirement: 'RESIDENT_DIRECTOR_REQUIRED',
        message: 'At least one director must be an Indian resident (stayed in India for ≥ 182 days).',
      });
    }

    // 4. DIN Check
    stakeholders.forEach(s => {
      const hasDin = s.existing_din && s.existing_din.trim().length > 0;
      if (!hasDin) {
        reports.push({
          stakeholder: s.full_name,
          requirement: 'DIN_APPLICATION',
          message: 'Director Identification Number (DIN) will be applied through SPICe+ (Step 5).',
        });
      }
    });

    // 5. Authorized Capital Check
    if (record.master_data && (Number(record.master_data.authorised_capital) || 0) < 100000) {
      reports.push({
        stakeholder: 'Capitalization',
        requirement: 'CAPITAL_ADVISORY',
        message: 'Suggested minimum authorized capital is ₹1,00,000 for standard Private Limited compliance.',
      });
    }

    return reports;
  }
}
