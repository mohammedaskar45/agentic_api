import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('buyback_master_data')
export class BuybackMasterData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  company_type: 'PRIVATE' | 'PUBLIC' | 'LISTED';

  @Column({ type: 'numeric', default: 0 })
  paid_up_capital: number;

  @Column({ type: 'numeric', default: 0 })
  free_reserves: number;

  @Column({ type: 'numeric', default: 0 })
  securities_premium: number;

  @Column({ type: 'numeric', default: 0 })
  total_debt: number;

  @Column({ type: 'numeric', default: 0 })
  buyback_amount: number;

  @Column({ type: 'numeric', default: 0 })
  shares_to_buyback: number;

  @Column({ type: 'numeric', default: 0 })
  buyback_price: number;

  @Column({ nullable: true })
  buyback_method: 'TENDER' | 'OPEN_MARKET';

  @Column({ nullable: true })
  source_of_funds: string;

  @Column({ type: 'date', nullable: true })
  board_meeting_date: string;

  @Column({ type: 'date', nullable: true })
  egm_date: string;

  @Column({ type: 'date', nullable: true })
  last_buyback_date: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

@Entity('buyback_workflow')
export class Buyback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  company_id: string;

  @Column({ default: 0 })
  current_step_id: number;

  @Column({ type: 'jsonb', nullable: true })
  workflow_status: any[];

  @OneToOne(() => BuybackMasterData, { cascade: true })
  @JoinColumn()
  master_data: BuybackMasterData;

  @Column({ type: 'jsonb', nullable: true })
  eligibility_results: any;

  @Column({ type: 'jsonb', nullable: true })
  step_uploads: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
