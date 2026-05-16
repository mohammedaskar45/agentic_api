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

  @Column({ name: 'residential_address', type: 'text', nullable: false })
  residential_address: string;

  @Column({ name: 'occupation', length: 100, nullable: false })
  occupation: string;

  @Column({ name: 'email_id', length: 255, nullable: false })
  email_id: string;

  @Column({ name: 'mobile_number', length: 20, nullable: true })
  mobile_number: string;

  @Column({ name: 'existing_din', length: 50, nullable: true })
  existing_din: string;

  @Column({ name: 'designation', length: 100, nullable: false })
  designation: string;

  @Column({ name: 'share_subscription', length: 50, nullable: true })
  share_subscription: string;

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
