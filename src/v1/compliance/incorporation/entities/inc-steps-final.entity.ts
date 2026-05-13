import {
  Entity,
  Column,
  PrimaryColumn,
  Generated,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Incorporation } from './incorporation.entity';

@Entity({ name: 'cs_inc_bank' })
export class IncBank {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  inc_bank_id: string;

  @Column({ name: 'incorporation_id', type: 'uuid', nullable: false })
  incorporation_id: string;

  @OneToOne(() => Incorporation)
  @JoinColumn({ name: 'incorporation_id' })
  incorporation: Incorporation;

  @Column({ name: 'bank_name', length: 255, nullable: false })
  bank_name: string;

  @Column({ name: 'account_number', length: 100, nullable: false })
  account_number: string;

  @Column({ name: 'ifsc_code', length: 20, nullable: false })
  ifsc_code: string;

  @Column({ name: 'branch_name', length: 255, nullable: true })
  branch_name: string;

  @Column({ name: 'branch', length: 255, nullable: true })
  branch: string;

  @Column({ name: 'account_type', length: 50, nullable: true })
  account_type: string;

  @CreateDateColumn({ name: 'created_on', type: 'timestamptz', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  created_on: Date;

  @UpdateDateColumn({ name: 'updated_on', type: 'timestamptz', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  updated_on: Date;
}

@Entity({ name: 'cs_inc_agile' })
export class IncAgile {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  inc_agile_id: string;

  @Column({ name: 'incorporation_id', type: 'uuid', nullable: false })
  incorporation_id: string;

  @OneToOne(() => Incorporation)
  @JoinColumn({ name: 'incorporation_id' })
  incorporation: Incorporation;

  @Column({ name: 'gst_required', default: false })
  gst_required: boolean;

  @Column({ name: 'epfo_required', default: false })
  epfo_required: boolean;

  @Column({ name: 'esic_required', default: false })
  esic_required: boolean;

  @Column({ name: 'prof_tax_required', default: false })
  prof_tax_required: boolean;

  @Column({ name: 'shops_establishment_required', default: false })
  shops_establishment_required: boolean;

  @Column({ name: 'gstin', length: 50, nullable: true })
  gstin: string;

  @Column({ name: 'state_jurisdiction', length: 100, nullable: true })
  state_jurisdiction: string;

  @Column({ name: 'taxpayer_type', length: 50, nullable: true })
  taxpayer_type: string;

  @Column({ name: 'epfo_number', length: 100, nullable: true })
  epfo_number: string;

  @Column({ name: 'esic_number', length: 100, nullable: true })
  esic_number: string;

  @Column({ name: 'establishment_id', length: 100, nullable: true })
  establishment_id: string;

  @Column({ name: 'center_jurisdiction', length: 100, nullable: true })
  center_jurisdiction: string;

  @Column({ name: 'hsn_sac_code', length: 50, nullable: true })
  hsn_sac_code: string;

  @Column({ name: 'nature_of_possession_detailed', length: 100, nullable: true })
  nature_of_possession_detailed: string;

  @CreateDateColumn({ name: 'created_on', type: 'timestamptz', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  created_on: Date;

  @UpdateDateColumn({ name: 'updated_on', type: 'timestamptz', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  updated_on: Date;
}
