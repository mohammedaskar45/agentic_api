import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Buyback, BuybackMasterData } from './entities/buyback.entity';
import { Incorporation } from '../incorporation/entities/incorporation.entity';

@Injectable()
export class BuybackService {
  constructor(
    @InjectRepository(Buyback)
    private readonly bbRepository: Repository<Buyback>,
    @InjectRepository(BuybackMasterData)
    private readonly masterDataRepository: Repository<BuybackMasterData>,
    @InjectRepository(Incorporation)
    private readonly incRepository: Repository<Incorporation>,
  ) {}

  async getStatus(companyId: string): Promise<Buyback> {
    if (!companyId) throw new NotFoundException('Company ID missing');
    
    let record = await this.bbRepository.findOne({
      where: { company_id: companyId },
      relations: ['master_data'],
    });

    if (!record) {
      // Try to patch data from Incorporation
      const incData = await this.incRepository.findOne({
          where: { company_id: companyId },
          relations: ['master_data']
      });

      const initialMaster = this.masterDataRepository.create({
          paid_up_capital: Number(incData?.master_data?.authorised_capital) || 0,
          company_type: incData?.master_data?.company_type === 'Private Limited' ? 'PRIVATE' : 'PUBLIC'
      });

      record = this.bbRepository.create({
        company_id: companyId,
        current_step_id: 0,
        workflow_status: this.getDefaultWorkflow('PRIVATE'),
        master_data: initialMaster
      });
      await this.bbRepository.save(record);
    }

    return record;
  }

  private getDefaultWorkflow(type: string): any[] {
    return [
      { id: 0, title: 'Master Data & Eligibility', status: 'current' },
      { id: 1, title: 'Board Approval', status: 'upcoming' },
      { id: 2, title: 'Shareholder Approval (EGM)', status: 'upcoming' },
      { id: 3, title: 'Solvency Filing (SH-9)', status: 'upcoming' },
      { id: 4, title: 'Letter of Offer (SH-8)', status: 'upcoming' },
      { id: 5, title: 'Offer Execution & Payment', status: 'upcoming' },
      { id: 6, title: 'Extinguishment & Return (SH-11)', status: 'upcoming' },
    ];
  }

  async saveMasterData(companyId: string, data: any): Promise<Buyback> {
    const record = await this.getStatus(companyId);
    
    if (!record.master_data) {
      record.master_data = this.masterDataRepository.create(data as BuybackMasterData);
    } else {
      Object.assign(record.master_data, data);
    }

    await this.masterDataRepository.save(record.master_data);
    
    // Auto-run eligibility
    await this.runEligibility(companyId);

    const updated = await this.bbRepository.findOne({
        where: { id: record.id },
        relations: ['master_data']
    });
    return updated as Buyback;
  }

  async runEligibility(companyId: string): Promise<any> {
    const record = await this.getStatus(companyId);
    if (!record.master_data) return [];

    const md = record.master_data;
    const checks = [];

    // 1. Buyback Limit (25%)
    const netWorth = Number(md.paid_up_capital) + Number(md.free_reserves);
    const limit = netWorth * 0.25;
    const boardLimit = netWorth * 0.10;

    checks.push({
      id: 'limit',
      title: 'Buyback Limit (25% Rule)',
      status: Number(md.buyback_amount) <= limit ? 'green' : 'red',
      message: `Maximum allowed buyback is Rs. ${limit.toLocaleString()}.`,
      remedy: 'Reduce buyback amount or increase reserves.'
    });

    // 1a. Resolution Type
    const isSpecial = Number(md.buyback_amount) > boardLimit;
    checks.push({
        id: 'resolution_type',
        title: 'Approval Authority',
        status: 'amber',
        message: isSpecial ? 'Special Resolution required (>10%)' : 'Board Resolution sufficient (≤10%)',
        remedy: isSpecial ? 'Ensure EGM notice is prepared.' : 'Board approval is enough.'
    });

    // 2. Debt-Equity Ratio (2:1)
    const postEquity = (Number(md.paid_up_capital) + Number(md.free_reserves)) - Number(md.buyback_amount);
    const ratio = Number(md.total_debt) / postEquity;
    checks.push({
      id: 'debt_equity',
      title: 'Post-Buyback Debt:Equity Ratio',
      status: ratio <= 2 ? 'green' : 'red',
      message: `Calculated ratio is ${ratio.toFixed(2)}:1. Must be ≤ 2:1.`,
      remedy: 'Reduce debt or reduce buyback size.'
    });

    // 3. Cooling-off Period (12 months)
    if (md.last_buyback_date) {
        const lastDate = new Date(md.last_buyback_date);
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        checks.push({
            id: 'cooling_off',
            title: 'Cooling-off Period',
            status: lastDate < twelveMonthsAgo ? 'green' : 'red',
            message: 'No buyback permitted within 12 months of previous completion.',
            remedy: 'Wait until the cooling-off period expires.'
        });
    }

    record.eligibility_results = checks;
    await this.bbRepository.save(record);
    return checks;
  }

  async generateDrafts(companyId: string, stepId: number): Promise<any[]> {
      const record = await this.getStatus(companyId);
      const md = record.master_data;
      const drafts = [];

      if (stepId === 1) { // Board Approval
          drafts.push({
              title: 'Board Resolution - Buyback Approval',
              content: `RESOLVED THAT pursuant to Section 68 of the Companies Act, 2013, the Board hereby approves the buyback of ${md.shares_to_buyback} shares at a price of Rs. ${md.buyback_price} per share...`
          });
      }

      if (stepId === 3) { // Solvency
          drafts.push({
              title: 'Declaration of Solvency (Form SH-9)',
              content: `FORM SH-9\n\nWe, the directors of the Company, do hereby solemnly affirm that we have made a full inquiry into the affairs of the company...`
          });
      }

      if (stepId === 4) { // SH-8
          drafts.push({
              title: 'Letter of Offer (Form SH-8)',
              content: `LETTER OF OFFER\n(Pursuant to Rule 17(4))\n\nDear Shareholder,\nThe Company offers to buyback ${md.shares_to_buyback} equity shares...`
          });
      }

      return drafts;
  }

  async saveStep(companyId: string, stepId: number, data: any): Promise<Buyback> {
    const record = await this.getStatus(companyId);
    
    if (record.workflow_status[stepId]) {
        record.workflow_status[stepId].status = 'completed';
        if (record.workflow_status[stepId + 1]) {
            record.workflow_status[stepId + 1].status = 'current';
            record.current_step_id = stepId + 1;
        }
    }

    return await this.bbRepository.save(record);
  }
}
