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

@Entity({ name: 'cs_inc_moa_aoa' })
export class IncMoaAoa {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  inc_moa_aoa_id: string;

  @Column({ name: 'incorporation_id', type: 'uuid', nullable: false })
  incorporation_id: string;

  @OneToOne(() => Incorporation)
  @JoinColumn({ name: 'incorporation_id' })
  incorporation: Incorporation;

  @Column({ name: 'moa_content', type: 'text', nullable: false })
  moa_content: string;

  @Column({ name: 'aoa_content', type: 'text', nullable: false })
  aoa_content: string;

  @CreateDateColumn({ name: 'created_on', type: 'timestamptz', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  created_on: Date;

  @UpdateDateColumn({ name: 'updated_on', type: 'timestamptz', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  updated_on: Date;
}

@Entity({ name: 'cs_inc_spice' })
export class IncSpice {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  inc_spice_id: string;

  @Column({ name: 'incorporation_id', type: 'uuid', nullable: false })
  incorporation_id: string;

  @OneToOne(() => Incorporation)
  @JoinColumn({ name: 'incorporation_id' })
  incorporation: Incorporation;

  @Column({ name: 'submission_status', length: 50, default: 'pending' })
  submission_status: string;

  @Column({ name: 'mca_reference_id', length: 100, nullable: true })
  mca_reference_id: string;

  @Column({ name: 'filing_status', length: 50, nullable: true })
  filing_status: string;

  @Column({ name: 'srn_number', length: 50, nullable: true })
  srn_number: string;

  @Column({ name: 'is_small_company', default: true })
  is_small_company: boolean;

  @Column({ name: 'inc9_declaration_accepted', default: false })
  inc9_declaration_accepted: boolean;

  @CreateDateColumn({ name: 'created_on', type: 'timestamptz', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  created_on: Date;

  @UpdateDateColumn({ name: 'updated_on', type: 'timestamptz', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  updated_on: Date;
}

@Entity({ name: 'cs_inc_coi' })
export class IncCoi {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  inc_coi_id: string;

  @Column({ name: 'incorporation_id', type: 'uuid', nullable: false })
  incorporation_id: string;

  @OneToOne(() => Incorporation)
  @JoinColumn({ name: 'incorporation_id' })
  incorporation: Incorporation;

  @Column({ name: 'coi_number', length: 100, nullable: true })
  coi_number: string;

  @Column({ name: 'registration_date', length: 50, nullable: true })
  registration_date: string;

  @Column({ name: 'cin', length: 50, nullable: true })
  cin: string;

  @Column({ name: 'incorporation_date', type: 'date', nullable: true })
  incorporation_date: string;

  @Column({ name: 'pan', length: 20, nullable: true })
  pan: string;

  @Column({ name: 'pan_area_code', length: 10, nullable: true })
  pan_area_code: string;

  @Column({ name: 'pan_ao_type', length: 10, nullable: true })
  pan_ao_type: string;

  @Column({ name: 'pan_range_code', length: 10, nullable: true })
  pan_range_code: string;

  @Column({ name: 'pan_ao_no', length: 10, nullable: true })
  pan_ao_no: string;

  @Column({ name: 'tan', length: 20, nullable: true })
  tan: string;

  @Column({ name: 'tan_area_code', length: 10, nullable: true })
  tan_area_code: string;

  @Column({ name: 'tan_ao_type', length: 10, nullable: true })
  tan_ao_type: string;

  @Column({ name: 'tan_range_code', length: 10, nullable: true })
  tan_range_code: string;

  @Column({ name: 'tan_ao_no', length: 10, nullable: true })
  tan_ao_no: string;

  @CreateDateColumn({ name: 'created_on', type: 'timestamptz', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  created_on: Date;

  @UpdateDateColumn({ name: 'updated_on', type: 'timestamptz', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  updated_on: Date;
}

@Entity({ name: 'cs_inc_commencement' })
export class IncCommencement {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  inc_commencement_id: string;

  @Column({ name: 'incorporation_id', type: 'uuid', nullable: false })
  incorporation_id: string;

  @OneToOne(() => Incorporation)
  @JoinColumn({ name: 'incorporation_id' })
  incorporation: Incorporation;

  @Column({ name: 'subscription_paid', default: false })
  subscription_paid: boolean;

  @Column({ name: 'bank_statement_ref', type: 'text', nullable: true })
  bank_statement_ref: string;

  @Column({ name: 'status', length: 50, default: 'pending' })
  status: string;

  @CreateDateColumn({ name: 'created_on', type: 'timestamptz', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  created_on: Date;

  @UpdateDateColumn({ name: 'updated_on', type: 'timestamptz', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  updated_on: Date;
}
