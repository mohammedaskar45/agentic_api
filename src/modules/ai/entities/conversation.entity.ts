import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../../v1/master/access-control/users.entity';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  tool_calls?: ToolCallLog[];
  tokens?: number;
}

export interface ToolCallLog {
  tool: string;
  args: Record<string, unknown>;
  result: string;
  executedAt: string;
  duration_ms: number;
}

@Entity({ name: 'ai_conversations' })
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'title', length: 255, default: 'New Conversation' })
  title: string;

  @Column({ name: 'messages', type: 'jsonb', default: [] })
  messages: ChatMessage[];

  @Column({ name: 'token_usage', type: 'int', default: 0 })
  token_usage: number;

  @Column({ name: 'is_pinned', type: 'boolean', default: false })
  is_pinned: boolean;

  @Column({ name: 'is_archived', type: 'boolean', default: false })
  is_archived: boolean;

  @Column({ name: 'model_used', length: 100, default: 'gpt-4.1' })
  model_used: string;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}
