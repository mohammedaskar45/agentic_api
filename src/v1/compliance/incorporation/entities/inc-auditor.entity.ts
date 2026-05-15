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

@Entity({ name: 'cs_inc_auditor' })
export class IncAuditor {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  inc_auditor_id: string;

  @Column({ name: 'incorporation_id', type: 'uuid', nullable: false })
  incorporation_id: string;

  @OneToOne(() => Incorporation)
  @JoinColumn({ name: 'incorporation_id' })
  incorporation: Incorporation;

  @Column({ name: 'auditor_name', length: 255, nullable: true })
  auditor_name: string;

  @Column({ name: 'auditor_frn', length: 100, nullable: true })
  auditor_frn: string;

  @Column({ name: 'auditor_address', type: 'text', nullable: true })
  auditor_address: string;

  @Column({ name: 'auditor_email', length: 255, nullable: true })
  auditor_email: string;

  @Column({ name: 'appointment_date', type: 'date', nullable: true })
  appointment_date: string;

  @Column({ name: 'consent_received', default: false })
  consent_received: boolean;

  @Column({ name: 'adt1_filed', default: false })
  adt1_filed: boolean;

  @Column({ name: 'adt1_srn', length: 50, nullable: true })
  adt1_srn: string;

  @CreateDateColumn({ name: 'created_on', type: 'timestamptz', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  created_on: Date;

  @UpdateDateColumn({ name: 'updated_on', type: 'timestamptz', nullable: true, default: () => 'CURRENT_TIMESTAMP' })
  updated_on: Date;
}
