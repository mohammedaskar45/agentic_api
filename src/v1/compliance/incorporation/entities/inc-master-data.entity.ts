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
import { User } from 'src/v1/master/access-control/users.entity';

@Entity({ name: 'cs_inc_master_data' })
export class IncMasterData {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  inc_master_data_id: string;

  @Column({ name: 'incorporation_id', type: 'uuid', nullable: false })
  incorporation_id: string;

  @OneToOne(() => Incorporation)
  @JoinColumn({ name: 'incorporation_id' })
  incorporation: Incorporation;

  // Company Details
  @Column({ name: 'proposed_name', length: 255, nullable: false })
  proposed_name: string;

  @Column({ name: 'alternative_name', length: 255, nullable: true })
  alternative_name: string;

  @Column({ name: 'cin', length: 50, nullable: true })
  cin: string;

  @Column({ name: 'company_type', length: 100, nullable: false })
  company_type: string;

  @Column({ name: 'main_objects', type: 'text', nullable: false })
  main_objects: string;

  @Column({ name: 'ancillary_objects', type: 'text', nullable: true })
  ancillary_objects: string;

  @Column({ name: 'authorised_capital', length: 50, nullable: false })
  authorised_capital: string;

  @Column({ name: 'paid_up_capital', length: 50, nullable: false })
  paid_up_capital: string;

  @Column({ name: 'face_value', length: 20, nullable: false })
  face_value: string;

  @Column({ name: 'state', length: 100, nullable: false })
  state: string;

  @Column({ name: 'registered_address', type: 'text', nullable: false })
  registered_address: string;

  @Column({ name: 'official_email', length: 255, nullable: true })
  official_email: string;

  @Column({ name: 'official_phone', length: 50, nullable: true })
  official_phone: string;

  // Registered Office Statutory Details
  @Column({ name: 'office_ownership_type', length: 100, nullable: true })
  office_ownership_type: string;

  @Column({ name: 'office_owner_name', length: 255, nullable: true })
  office_owner_name: string;

  @Column({ name: 'utility_bill_type', length: 100, nullable: true })
  utility_bill_type: string;

  @Column({ name: 'utility_bill_file_id', type: 'uuid', nullable: true })
  utility_bill_file_id: string;

  @Column({ name: 'noc_file_id', type: 'uuid', nullable: true })
  noc_file_id: string;

  // Capital Expansion (Table 3.1)
  @Column({ name: 'preference_capital', type: 'decimal', precision: 15, scale: 2, default: 0 })
  preference_capital: number;

  @Column({ name: 'preference_face_value', type: 'decimal', precision: 10, scale: 2, default: 10 })
  preference_face_value: number;

  // Professional Details (Table 3.3)
  @Column({ name: 'ca_cs_name', length: 255, nullable: false })
  ca_cs_name: string;

  @Column({ name: 'membership_no', length: 50, nullable: false })
  membership_no: string;

  @Column({ name: 'auditor_name', length: 255, nullable: false })
  auditor_name: string;

  @Column({ name: 'auditor_frn', length: 50, nullable: false })
  auditor_frn: string;

  @Column({ name: 'auditor_address', type: 'text', nullable: false })
  auditor_address: string;

  @Column({ name: 'auditor_email', length: 255, nullable: false })
  auditor_email: string;

  @Column({ name: 'bank_name', length: 255, nullable: false })
  bank_name: string;

  @Column({ name: 'bank_account', length: 100, nullable: false })
  bank_account: string;

  @Column({ name: 'police_station', length: 255, nullable: true })
  police_station: string;

  @Column({ name: 'jurisdiction', length: 255, nullable: true })
  jurisdiction: string;

  // MoA/AoA Witness Details (Table 3.4)
  @Column({ name: 'witness_name', length: 255, nullable: true })
  witness_name: string;

  @Column({ name: 'witness_father_name', length: 255, nullable: true })
  witness_father_name: string;

  @Column({ name: 'witness_address', type: 'text', nullable: true })
  witness_address: string;

  @Column({ name: 'witness_occupation', length: 100, nullable: true })
  witness_occupation: string;

  @Column({ name: 'status', default: 1, nullable: false })
  status: number;

  @Column({ name: 'is_deleted', default: 0, nullable: true, select: false })
  is_deleted: number;

  @CreateDateColumn({ name: 'created_on', type: 'timestamptz', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  created_on: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  created_by: string;

  @UpdateDateColumn({
    name: 'updated_on',
    nullable: true,
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updated_on: Date;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updated_by: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  createdByUser: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'updated_by' })
  updatedByUser: User;
}
