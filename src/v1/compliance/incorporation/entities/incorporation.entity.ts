import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToOne, OneToMany, Generated, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '../../../../helpers/base.entity';
import { Company } from '../../../master/access-control/companies.entity';
import { IncMasterData } from './inc-master-data.entity';
import { IncStakeholder } from './inc-stakeholder.entity';
import { IncDsc, IncDin, IncRun } from './inc-steps-basic.entity';
import { IncMoaAoa, IncSpice, IncCoi, IncCommencement } from './inc-steps-advanced.entity';
import { IncBank, IncAgile } from './inc-steps-final.entity';

export interface WorkflowStepStatus {
  id: number;
  status: 'completed' | 'current' | 'upcoming';
  updated_at?: Date;
}

@Entity('cs_incorporation')
export class Incorporation extends BaseEntity {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  incorporation_id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  // Relations to Step Data
  @OneToOne(() => IncMasterData, (m) => m.incorporation)
  master_data: IncMasterData;

  @OneToMany(() => IncStakeholder, (s) => s.incorporation)
  stakeholders: IncStakeholder[];

  @OneToOne(() => IncDsc, (d) => d.incorporation)
  dsc_data: IncDsc;

  @OneToOne(() => IncDin, (d) => d.incorporation)
  din_data: IncDin;

  @OneToOne(() => IncRun, (r) => r.incorporation)
  run_data: IncRun;

  @OneToOne(() => IncMoaAoa, (m) => m.incorporation)
  moa_aoa_data: IncMoaAoa;

  @OneToOne(() => IncSpice, (s) => s.incorporation)
  spice_data: IncSpice;

  @OneToOne(() => IncCoi, (c) => c.incorporation)
  coi_data: IncCoi;

  @OneToOne(() => IncBank, (b) => b.incorporation)
  bank_data: IncBank;

  @OneToOne(() => IncAgile, (a) => a.incorporation)
  agile_data: IncAgile;

  @OneToOne(() => IncCommencement, (c) => c.incorporation)
  commencement_data: IncCommencement;

  @Column({ type: 'jsonb', nullable: true })
  step_uploads: any;

  @Column({ type: 'int', default: 0 })
  current_step_id: number;

  @Column({ type: 'jsonb', nullable: true })
  workflow_status: WorkflowStepStatus[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // For additional compliance logs
}
