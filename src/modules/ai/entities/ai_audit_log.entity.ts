import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../v1/master/access-control/users.entity';

@Entity({ name: 'ai_audit_logs' })
export class AiAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'conversation_id', type: 'uuid', nullable: true })
  conversation_id: string;

  @Column({ name: 'event_type', length: 100 })
  event_type: string; // 'tool_call' | 'message' | 'error' | 'rate_limit'

  @Column({ name: 'tool_name', length: 100, nullable: true })
  tool_name: string;

  @Column({ name: 'payload', type: 'jsonb', nullable: true })
  payload: Record<string, unknown>;

  @Column({ name: 'result', type: 'text', nullable: true })
  result: string;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  duration_ms: number;

  @Column({ name: 'tokens_used', type: 'int', default: 0 })
  tokens_used: number;

  @Column({ name: 'ip_address', length: 50, nullable: true })
  ip_address: string;

  @Column({ name: 'success', type: 'boolean', default: true })
  success: boolean;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  error_message: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;
}
