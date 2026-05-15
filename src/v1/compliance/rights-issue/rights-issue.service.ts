import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RightsIssue, RiMasterData } from './entities/rights-issue.entity';

@Injectable()
export class RightsIssueService {
  constructor(
    @InjectRepository(RightsIssue)
    private readonly riRepository: Repository<RightsIssue>,
    @InjectRepository(RiMasterData)
    private readonly masterDataRepository: Repository<RiMasterData>,
  ) {}

  async getStatus(companyId: string): Promise<RightsIssue> {
    if (!companyId) throw new NotFoundException('Company ID missing in headers');
    
    let record = await this.riRepository.findOne({
      where: { company_id: companyId },
      relations: ['master_data'],
    });

    if (!record) {
      record = this.riRepository.create({
        company_id: companyId,
        current_step_id: 0,
        workflow_status: this.getDefaultWorkflow('PRIVATE'),
      });
      await this.riRepository.save(record);
    }

    return record;
  }

  private getDefaultWorkflow(type: 'PRIVATE' | 'LISTED'): any[] {
    const commonPrefix = [
      { id: 0, title: 'Master Data Entry', status: 'current' },
      { id: 1, title: 'Eligibility Check', status: 'upcoming' },
      { id: 2, title: 'Board Approval', status: 'upcoming' },
    ];

    if (type === 'PRIVATE') {
      return [
        ...commonPrefix,
        { id: 3, title: 'Letter of Offer (PAS-4)', status: 'upcoming' },
        { id: 4, title: 'Dispatch to Shareholders', status: 'upcoming' },
        { id: 5, title: 'Offer Period', status: 'upcoming' },
        { id: 6, title: 'Basis of Allotment', status: 'upcoming' },
        { id: 7, title: 'Board Meeting (Allotment)', status: 'upcoming' },
        { id: 8, title: 'Return of Allotment (PAS-3)', status: 'upcoming' },
      ];
    } else {
      return [
        ...commonPrefix,
        { id: 3, title: 'Lead Manager & RTA Appointment', status: 'upcoming' },
        { id: 4, title: 'Record Date & Exchange Intimation', status: 'upcoming' },
        { id: 5, title: 'Draft Letter of Offer (DLOF)', status: 'upcoming' },
        { id: 6, title: 'SEBI Review & Observations', status: 'upcoming' },
        { id: 7, title: 'Final Letter of Offer (LOF)', status: 'upcoming' },
        { id: 8, title: 'Offer Period (ASBA)', status: 'upcoming' },
        { id: 9, title: 'Basis of Allotment', status: 'upcoming' },
        { id: 10, title: 'Board Meeting (Allotment)', status: 'upcoming' },
        { id: 11, title: 'Post-Issue Filings (SEBI + ROC)', status: 'upcoming' },
      ];
    }
  }

  async saveMasterData(companyId: string, data: any): Promise<RightsIssue> {
    const record = await this.getStatus(companyId);
    
    if (!record.master_data) {
      record.master_data = this.masterDataRepository.create(data as RiMasterData);
    } else {
      Object.assign(record.master_data, data);
    }

    // If company type changed, re-bootstrap workflow
    if (data.company_type && data.company_type !== record.master_data.company_type) {
        record.workflow_status = this.getDefaultWorkflow(data.company_type);
    }

    if (data.shares_to_issue && data.issue_price) {
        record.master_data.subscription_amount = Number(data.shares_to_issue) * Number(data.issue_price);
    }

    await this.masterDataRepository.save(record.master_data);
    
    // Auto-progress to eligibility check if data is complete
    if (record.current_step_id === 0 && record.workflow_status && record.workflow_status.length > 1) {
        record.current_step_id = 1;
        record.workflow_status[0].status = 'completed';
        record.workflow_status[1].status = 'current';
    }

    return await this.riRepository.save(record);
  }

  async runEligibility(companyId: string): Promise<any> {
    const record = await this.getStatus(companyId);
    if (!record.master_data) throw new NotFoundException('Master data not found');

    const md = record.master_data;
    const checks = [];

    // 1. Authorised Capital Check (Simulated)
    const currentPaidUp = 1000000; // Mock current paid-up
    const authorised = Number(md.subscription_amount) + currentPaidUp; // Example auth check
    checks.push({
      id: 'auth_cap',
      title: 'Authorised Capital Capacity',
      status: Number(md.shares_to_issue) * Number(md.issue_price) < 50000000 ? 'green' : 'red',
      message: 'Post-issue capital must be within MoA limits.',
      remedy: 'Increase Authorised Capital via SH-7 first.'
    });

    // 2. Issue Price Check
    checks.push({
      id: 'issue_price',
      title: 'Issue Price vs Face Value',
      status: Number(md.issue_price) >= Number(md.face_value) ? 'green' : 'red',
      message: 'Shares cannot be issued at a discount.',
      remedy: 'Increase issue price to at least face value.'
    });

    // 3. SEBI Eligibility (if listed)
    if (md.company_type === 'LISTED') {
        checks.push({
            id: 'sebi_fast_track',
            title: 'SEBI Fast Track Eligibility',
            status: 'amber',
            message: 'Checking trading history and compliance track record...',
            remedy: 'Ensure no defaults in listing agreement.'
        });
    }

    record.eligibility_results = checks;
    await this.riRepository.save(record);
    return checks;
  }

  async generateDrafts(companyId: string, stepId: number): Promise<any> {
      const record = await this.getStatus(companyId);
      const md = record.master_data;

      // Mock AI Drafting Logic
      const drafts = [];
      
      if (stepId === 2) { // Board Approval
          drafts.push({
              title: 'Board Resolution - Rights Issue Approval',
              content: `RESOLVED THAT pursuant to Section 62(1)(a) of the Companies Act, 2013, the consent of the Board be and is hereby accorded to offer and issue ${md.shares_to_issue} equity shares of face value Rs. ${md.face_value} each at a price of Rs. ${md.issue_price} per share...`
          });
          drafts.push({
              title: 'Notice of Board Meeting',
              content: `Notice is hereby given that a meeting of the Board of Directors of the Company will be held on ${md.board_meeting_date}...`
          });
      }

      if (md.company_type === 'PRIVATE' && stepId === 3) {
          drafts.push({
              title: 'Letter of Offer (Form PAS-4)',
              content: `LETTER OF OFFER\n(Pursuant to Section 62(1)(a))\n\nDear Shareholder,\nWe are pleased to offer you rights shares in the ratio of ${md.entitlement_ratio}...`
          });
      }

      if (stepId === 5) { // Allotment
          drafts.push({
              title: 'Board Resolution - Allotment of Shares',
              content: `RESOLVED THAT pursuant to Section 62(1)(a) and Section 39 of the Companies Act, 2013, the consent of the Board be and is hereby accorded to allot ${md.shares_to_issue} equity shares to the applicants as per the Basis of Allotment...`
          });
          drafts.push({
              title: 'PAS-3 Return of Allotment - Covering Letter',
              content: `To,\nThe Registrar of Companies,\n\nSub: Filing of Return of Allotment in Form PAS-3 for Rights Issue of ${md.shares_to_issue} shares.`
          });
      }

      return drafts;
  }

  async saveStep(companyId: string, stepId: number, data: any): Promise<RightsIssue> {
      const record = await this.getStatus(companyId);
      
      // Update workflow status
      if (record.workflow_status[stepId]) {
          record.workflow_status[stepId].status = 'completed';
          if (record.workflow_status[stepId + 1]) {
              record.workflow_status[stepId + 1].status = 'current';
              record.current_step_id = stepId + 1;
          }
      }

      return await this.riRepository.save(record);
  }

  async generateRELetters(companyId: string) {
      const record = await this.getStatus(companyId);
      const md = record.master_data;
      
      // Mock Shareholders (In production, this would come from the Register of Members)
      const shareholders = [
          { name: 'John Doe', shares: 1000 },
          { name: 'Jane Smith', shares: 500 },
      ];

      const ratioNum = 1 / 5; // e.g., 1:5

      return shareholders.map(s => {
          const entitled = Math.floor(s.shares * ratioNum);
          return {
              shareholder: s.name,
              title: `Rights Entitlement (RE) Letter - ${s.name}`,
              content: `Dear ${s.name},\n\nAs on the Record Date (${md.record_date}), you hold ${s.shares} equity shares in the Company. Based on the Entitlement Ratio of ${md.entitlement_ratio}, you are entitled to subscribe to ${entitled} new equity shares.\n\nISIN: ${md.isin || 'N/A'}\nOffer Price: Rs. ${md.issue_price}`
          };
      });
  }
}
