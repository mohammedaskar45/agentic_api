import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index } from 'typeorm';

@Entity('incorporation_logs')
export class IncorporationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  company_id: string;

  @Column()
  event_type: string; // STEP_COMPLETED, DOC_UPLOADED, DOC_VERIFIED, RECORD_CREATED

  @Column('text')
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn()
  created_at: Date;
}
