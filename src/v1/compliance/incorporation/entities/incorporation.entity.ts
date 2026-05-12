import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../../helpers/base.entity';
import { Company } from '../../../master/access-control/companies.entity';

export interface WorkflowStepStatus {
  id: number;
  status: 'completed' | 'current' | 'upcoming';
  updated_at?: Date;
}

@Entity('cs_incorporation')
export class Incorporation extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  incorporation_id: string;

  @Column({ type: 'uuid' })
  company_id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'jsonb', nullable: true })
  dsc_data: any;

  @Column({ type: 'jsonb', nullable: true })
  din_data: any;

  @Column({ type: 'jsonb', nullable: true })
  run_data: any;

  @Column({ type: 'jsonb', nullable: true })
  moa_aoa_data: any;

  @Column({ type: 'jsonb', nullable: true })
  spice_data: any;

  @Column({ type: 'jsonb', nullable: true })
  pan_tan_data: any;

  @Column({ type: 'jsonb', nullable: true })
  coi_data: any;

  @Column({ type: 'jsonb', nullable: true })
  bank_data: any;

  @Column({ type: 'jsonb', nullable: true })
  gst_data: any;

  @Column({ type: 'jsonb', nullable: true })
  labor_data: any;

  @Column({ type: 'jsonb', nullable: true })
  commencement_data: any;

  @Column({ type: 'int', default: 1 })
  current_step_id: number;

  @Column({ type: 'jsonb', nullable: true })
  workflow_status: WorkflowStepStatus[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // For additional compliance logs
}
