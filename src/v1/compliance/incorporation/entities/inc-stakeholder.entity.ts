import {
  Entity,
  Column,
  PrimaryColumn,
  Generated,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Incorporation } from './incorporation.entity';
import { User } from 'src/v1/master/access-control/users.entity';

@Entity({ name: 'cs_inc_stakeholders' })
export class IncStakeholder {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  inc_stakeholder_id: string;

  @Column({ name: 'incorporation_id', type: 'uuid', nullable: false })
  incorporation_id: string;

  @ManyToOne(() => Incorporation)
  @JoinColumn({ name: 'incorporation_id' })
  incorporation: Incorporation;

  @Column({ name: 'full_name', length: 255, nullable: false })
  full_name: string;

  @Column({ name: 'father_name', length: 255, nullable: false })
  father_name: string;

  @Column({ name: 'dob', type: 'date', nullable: false })
  dob: string;

  @Column({ name: 'pan', length: 20, nullable: false })
  pan: string;

  @Column({ name: 'aadhaar', length: 20, nullable: true })
  aadhaar: string;

  @Column({ name: 'nationality', length: 100, nullable: false })
  nationality: string;

  @Column({ name: 'address', type: 'text', nullable: false })
  address: string;

  @Column({ name: 'occupation', length: 100, nullable: false })
  occupation: string;

  @Column({ name: 'occupation_type', length: 100, nullable: false })
  occupation_type: string;

  @Column({ name: 'highest_qualification', length: 255, nullable: true })
  highest_qualification: string;

  // Foreign National Details
  @Column({ name: 'is_foreign_national', default: false })
  is_foreign_national: boolean;

  @Column({ name: 'passport_number', length: 50, nullable: true })
  passport_number: string;

  @Column({ name: 'oci_number', length: 50, nullable: true })
  oci_number: string;

  @Column({ name: 'qualification', length: 100, nullable: false })
  qualification: string;

  @Column({ name: 'designation', length: 100, nullable: false })
  designation: string;

  @Column({ name: 'existing_din', length: 50, nullable: true })
  existing_din: string;

  @Column({ name: 'email', length: 255, nullable: false })
  email: string;

  @Column({ name: 'mobile', length: 20, nullable: true })
  mobile: string;

  @Column({ name: 'other_director_interest', type: 'text', nullable: true })
  other_director_interest: string;

  @Column({ name: 'id_proof_type', length: 100, nullable: true })
  id_proof_type: string;

  @Column({ name: 'address_proof_type', length: 100, nullable: true })
  address_proof_type: string;

  @Column({ name: 'equity_shares', type: 'bigint', default: 0 })
  equity_shares: number;

  @Column({ name: 'preference_shares', type: 'bigint', default: 0 })
  preference_shares: number;

  @Column({ name: 'shares_subscribed', length: 50, nullable: true })
  shares_subscribed: string;

  // Statutory Address History
  @Column({ name: 'present_address', type: 'text', nullable: true })
  present_address: string;

  @Column({ name: 'permanent_address', type: 'text', nullable: true })
  permanent_address: string;

  @Column({ name: 'is_permanent_same_as_present', default: true })
  is_permanent_same_as_present: boolean;

  @Column({ name: 'stay_duration_years', type: 'integer', nullable: true })
  stay_duration_years: number;

  @Column({ name: 'stay_duration_months', type: 'integer', nullable: true })
  stay_duration_months: number;

  @Column({ name: 'previous_address', type: 'text', nullable: true })
  previous_address: string;

  @Column({ name: 'place_of_birth', length: 255, nullable: true })
  place_of_birth: string;

  // Other Interests/Directorships
  @Column({ name: 'other_directorships', type: 'jsonb', nullable: true })
  other_directorships: any[];

  // Document Linkages
  @Column({ name: 'pan_file_id', type: 'uuid', nullable: true })
  pan_file_id: string;

  @Column({ name: 'aadhaar_file_id', type: 'uuid', nullable: true })
  aadhaar_file_id: string;

  @Column({ name: 'photo_file_id', type: 'uuid', nullable: true })
  photo_file_id: string;

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
