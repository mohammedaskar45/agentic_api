import {
  Entity,
  Column,
  PrimaryColumn,
  Generated,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Incorporation } from './incorporation.entity';

@Entity({ name: 'cs_inc_dsc' })
export class IncDsc {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  inc_dsc_id: string;

  @Column({ name: 'incorporation_id', type: 'uuid', nullable: false })
  incorporation_id: string;

  @OneToOne(() => Incorporation)
  @JoinColumn({ name: 'incorporation_id' })
  incorporation: Incorporation;

  @Column({ name: 'full_name', length: 255, nullable: false })
  full_name: string;

  @Column({ name: 'dob', type: 'date', nullable: false })
  dob: string;

  @Column({ name: 'father_name', length: 255, nullable: false })
  father_name: string;

  @Column({ name: 'nationality', length: 100, nullable: false })
  nationality: string;

  @Column({ name: 'pan', length: 20, nullable: false })
  pan: string;

  @Column({ name: 'aadhaar', length: 20, nullable: false })
  aadhaar: string;

  @Column({ name: 'status', length: 50, default: 'pending' })
  status: string;

  @CreateDateColumn({ name: 'created_on', type: 'timestamptz', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  created_on: Date;

  @UpdateDateColumn({ name: 'updated_on', type: 'timestamptz', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  updated_on: Date;
}

@Entity({ name: 'cs_inc_din' })
export class IncDin {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  inc_din_id: string;

  @Column({ name: 'incorporation_id', type: 'uuid', nullable: false })
  incorporation_id: string;

  @OneToOne(() => Incorporation)
  @JoinColumn({ name: 'incorporation_id' })
  incorporation: Incorporation;

  @Column({ name: 'directors_data', type: 'jsonb', nullable: false })
  directors: any[];

  @Column({ name: 'din_number', length: 50, nullable: true })
  din_number: string;

  @CreateDateColumn({ name: 'created_on', type: 'timestamptz', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  created_on: Date;

  @UpdateDateColumn({ name: 'updated_on', type: 'timestamptz', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  updated_on: Date;
}

@Entity({ name: 'cs_inc_run' })
export class IncRun {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  inc_run_id: string;

  @Column({ name: 'incorporation_id', type: 'uuid', nullable: false })
  incorporation_id: string;

  @OneToOne(() => Incorporation)
  @JoinColumn({ name: 'incorporation_id' })
  incorporation: Incorporation;

  @Column({ name: 'proposed_name_1', length: 255, nullable: false })
  proposed_name_1: string;

  @Column({ name: 'proposed_name_2', length: 255, nullable: true })
  proposed_name_2: string;

  @Column({ name: 'nic_code', length: 50, nullable: true })
  nic_code: string;

  @Column({ name: 'sector_category', length: 100, nullable: true })
  sector_category: string;

  @Column({ name: 'trademark_confirmed', default: false })
  trademark_confirmed: boolean;

  @Column({ name: 'significance', type: 'text', nullable: true })
  significance: string;

  @Column({ name: 'objectives_summary', type: 'text', nullable: true })
  objectives_summary: string;

  @Column({ name: 'tm_certificate_ref', length: 255, nullable: true })
  tm_certificate_ref: string;

  @Column({ name: 'nic_code_id', type: 'uuid', nullable: true })
  nic_code_id: string;

  @Column({ name: 'approval_status', length: 50, default: 'pending' })
  approval_status: string;

  @CreateDateColumn({ name: 'created_on', type: 'timestamptz', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  created_on: Date;

  @UpdateDateColumn({ name: 'updated_on', type: 'timestamptz', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  updated_on: Date;
}
