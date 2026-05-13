/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Incorporation,
  WorkflowStepStatus,
} from './entities/incorporation.entity';
import { IncorporationLog } from './entities/incorporation-log.entity';
import { MasterDropdown } from './entities/master-dropdown.entity';
import { IncMasterData } from './entities/inc-master-data.entity';
import { IncStakeholder } from './entities/inc-stakeholder.entity';
import { IncDsc, IncDin, IncRun } from './entities/inc-steps-basic.entity';
import {
  IncMoaAoa,
  IncSpice,
  IncCoi,
  IncCommencement,
} from './entities/inc-steps-advanced.entity';
import { IncBank, IncAgile } from './entities/inc-steps-final.entity';

@Injectable()
export class IncorporationService {
  constructor(
    @InjectRepository(Incorporation)
    private readonly incorporationRepository: Repository<Incorporation>,
    @InjectRepository(IncorporationLog)
    private readonly logRepository: Repository<IncorporationLog>,
    @InjectRepository(MasterDropdown)
    private readonly dropdownRepository: Repository<MasterDropdown>,
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
      ],
    });

    if (!data) {
      data = this.incorporationRepository.create({
        company_id: companyId,
        current_step_id: 0,
        workflow_status: Array.from({ length: 12 }, (_, i) => ({
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
      // Migration: Ensure Step 0 exists in existing records
      const hasStep0 = data.workflow_status.some((s: any) => s.id === 0);
      if (!hasStep0) {
        data.workflow_status.unshift({
          id: 0,
          status: data.master_data ? 'completed' : 'current',
        });
        // If we added step 0 and it's current, set current_step_id to 0
        if (!data.master_data) data.current_step_id = 0;
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

    return {
      daysElapsed: daysElapsed || 1,
      pendingTasks: pendingTasks,
      vaultFiles: vaultFiles || 0,
      progress: Math.round((completedSteps / 12) * 100),
    };
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
      preference_capital: data.capital?.preference_capital || 0,
      preference_face_value: data.capital?.preference_face_value || 10
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
          is_foreign_national: sData.is_foreign_national || false,
          passport_number: sData.passport_number,
          oci_number: sData.oci_number,
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
      company_type,
      main_objects,
      ancillary_objects,
      authorised_capital,
      paid_up_capital,
      face_value,
      state,
      registered_address,
      office_ownership_type,
      office_owner_name,
      utility_bill_type,
      utility_bill_file_id,
      noc_file_id,
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
      preference_capital,
      preference_face_value,
    } = record.master_data;

    return {
      company: {
        proposed_name,
        alternative_name,
        company_type,
        main_objects,
        ancillary_objects,
        authorised_capital,
        paid_up_capital,
        face_value,
        state,
        registered_address,
        office_ownership_type,
        office_owner_name,
        utility_bill_type,
        utility_bill_file_id,
        noc_file_id,
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
      capital: {
        authorised_capital: record.master_data.authorised_capital,
        paid_up_capital: record.master_data.paid_up_capital,
        face_value: record.master_data.face_value,
        preference_capital,
        preference_face_value,
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
    Object.assign(dsc, dscData);
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
      nic_code_id: runData.nic_code_id,
      sector_category: runData.sector_category,
      trademark_confirmed: runData.trademark_confirmed || false,
      tm_certificate_ref: runData.tm_certificate_ref,
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
  ): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);
    if (!record.step_uploads) record.step_uploads = {};

    record.step_uploads[stepId] = {
      ...fileMetadata,
      status: 'pending',
    };

    await this.logEvent(
      companyId,
      'DOC_UPLOADED',
      `Document uploaded for Step ${stepId}: ${fileMetadata.filename}`,
      { filename: fileMetadata.filename },
    );
    return await this.incorporationRepository.save(record);
  }

  async verifyDocument(
    companyId: string,
    stepId: number,
  ): Promise<Incorporation> {
    const record = await this.getByCompany(companyId);
    if (record.step_uploads && record.step_uploads[stepId]) {
      record.step_uploads[stepId].status = 'verified';
      record.step_uploads[stepId].verified_at = new Date();
      await this.logEvent(
        companyId,
        'DOC_VERIFIED',
        `AI Verification completed for Step ${stepId} document.`,
      );
    }
    return await this.incorporationRepository.save(record);
  }

  async generateDrafts(companyId: string): Promise<any[]> {
    const record = await this.getByCompany(companyId);
    if (!record.master_data) {
      throw new Error('Master Data missing. Please complete Step 0 first.');
    }

    const company = record.master_data; // This now contains both company and professional details
    const stakeholders = record.stakeholders || [];
    const companyName = company.proposed_name || 'PROPOSED COMPANY NAME';

    const documents = [
      {
        id: 'moa',
        title: 'Memorandum of Association (MoA)',
        category: 'Constitutional',
        content: `THE COMPANIES ACT, 2013\n(Company Limited by Shares)\n\nMEMORANDUM OF ASSOCIATION OF\n${companyName}\n\nI. The name of the company is ${companyName}.\n\nII. The registered office of the company will be situated in the State of ${company.state}.\n\nIII. (a) The objects to be pursued by the company on its incorporation are:\n1. To carry on the business of ${company.main_objects} and related IT/Compliance services.\n2. To provide technology-driven solutions for corporate governance.\n\n(b) Matters which are necessary for furtherance of the objects specified in clause III(a) are:\n${company.ancillary_objects || 'Standard ancillary objects as per Table A.'}\n\nIV. The liability of the member(s) is limited.\n\nV. The share capital of the company is Rs. ${company.authorised_capital} divided into ${Number(company.authorised_capital) / Number(company.face_value)} equity shares of Rs. ${company.face_value} each.\n\nSigned by Subscribers:\n${stakeholders.map((s: any) => `- ${s.full_name}`).join('\n')}`,
      },
      {
        id: 'aoa',
        title: 'Articles of Association (AoA)',
        category: 'Constitutional',
        content: `THE COMPANIES ACT, 2013\n(Company Limited by Shares)\n\nARTICLES OF ASSOCIATION OF\n${companyName}\n\n1. The regulations contained in Table 'F' in Schedule I to the Companies Act, 2013 shall apply to this Company so far as they are not inconsistent with the following articles.\n\n2. INTERPRETATION: In these articles, unless the context otherwise requires, expressions defined in the Act shall have the same meaning.\n\n3. PRIVATE COMPANY: The Company is a Private Company within the meaning of Section 2(68) of the Companies Act, 2013.\n\n4. SHARE CAPITAL: The Authorised Share Capital is Rs. ${company.authorised_capital}.\n\nSigned by Subscribers:\n${stakeholders.map((s: any) => `- ${s.full_name}`).join('\n')}`,
      },
      {
        id: 'dir2',
        title: 'DIR-2: Consent to act as Director',
        category: 'Pre-Incorporation',
        content: `FORM DIR-2\n(Pursuant to Section 152(5) and Rule 8 of Companies Appointment and Qualification of Directors Rules, 2014)\n\nTo,\nTHE BOARD OF DIRECTORS,\n${companyName}\n\nSubject: Consent to act as Director of ${companyName}\n\nI, ${stakeholders[0]?.full_name || 'Director'}, hereby give my consent to act as director of ${companyName} pursuant to sub-section (5) of section 152 of the Companies Act, 2013.\n\nDetails:\nPAN: ${stakeholders[0]?.pan}\nDOB: ${stakeholders[0]?.dob}\nAddress: ${stakeholders[0]?.address}\n\nSignature: ________________`,
      },
    ];

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
      account_number: bankData.account_number,
      ifsc_code: bankData.ifsc_code,
      branch_name: bankData.branch_name,
      branch: bankData.branch_name || bankData.branch || 'Main Branch',
      account_type: bankData.account_type,
    });
    record.bank_data = await this.incorporationRepository.manager.save(
      IncBank,
      bank,
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
      (s: WorkflowStepStatus) => s.id === 9,
    );
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find(
        (s: WorkflowStepStatus) => s.id === 10,
      );
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 10;
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
      (s: WorkflowStepStatus) => s.id === 10,
    );
    if (step && step.status !== 'completed') {
      step.status = 'completed';
      const nextStep = record.workflow_status.find(
        (s: WorkflowStepStatus) => s.id === 11,
      );
      if (nextStep) nextStep.status = 'current';
      record.current_step_id = 11;
    }
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
      (s: WorkflowStepStatus) => s.id === 11,
    );
    if (step && step.status !== 'completed') {
      step.status = 'completed';
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
}
