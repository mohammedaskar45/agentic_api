import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CommonStatus } from './keywords';

export abstract class BaseEntity {
  @Column({ name: 'status', default: CommonStatus.active, nullable: false })
  status: string;

  @CreateDateColumn({
    name: 'created_on',
    type: 'timestamptz',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_on: Date;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  created_by: string;

  @UpdateDateColumn({
    name: 'updated_on',
    nullable: true,
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_on: Date;

  @Column({ name: 'updated_by', type: 'uuid', nullable: true })
  updated_by: string;

  @Column({ name: 'is_deleted', default: 0, nullable: false, select: false })
  is_deleted: number;
}
