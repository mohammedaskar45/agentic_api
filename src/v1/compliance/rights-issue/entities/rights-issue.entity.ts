import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';

@Entity('ri_master_data')
export class RiMasterData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  company_type: 'PRIVATE' | 'LISTED';

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  shares_to_issue: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  issue_price: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  face_value: number;

  @Column({ nullable: true })
  entitlement_ratio: string; // e.g., "1:5"

  @Column({ type: 'date', nullable: true })
  record_date: Date;

  @Column({ type: 'date', nullable: true })
  offer_opening_date: Date;

  @Column({ type: 'date', nullable: true })
  offer_closing_date: Date;

  @Column({ type: 'text', nullable: true })
  purpose_of_issue: string;

  @Column({ type: 'date', nullable: true })
  board_meeting_date: Date;

  @Column({ type: 'date', nullable: true })
  egm_date: Date;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  subscription_amount: number;

  // Listed specific fields
  @Column({ nullable: true })
  stock_exchange: string;

  @Column({ nullable: true })
  isin: string;

  @Column({ nullable: true })
  lead_manager_name: string;

  @Column({ nullable: true })
  rta_name: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('rights_issue')
export class RightsIssue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_id: string;

  @Column({ default: 0 })
  current_step_id: number;

  @Column({ type: 'jsonb', nullable: true })
  workflow_status: any[]; // Array of step statuses

  @Column({ type: 'jsonb', nullable: true })
  step_uploads: Record<number, any>;

  @OneToOne(() => RiMasterData, { cascade: true })
  @JoinColumn()
  master_data: RiMasterData;

  @Column({ type: 'jsonb', nullable: true })
  eligibility_results: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
