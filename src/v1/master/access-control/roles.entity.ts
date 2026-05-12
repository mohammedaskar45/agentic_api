import { Entity, PrimaryColumn, Column, Generated } from 'typeorm';
import { BaseEntity } from 'src/helpers/base.entity';

@Entity({ name: 'roles' })
export class Role extends BaseEntity {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  role_id: string;

  @Column({ name: 'role_name', length: 255, unique: true, nullable: false })
  role_name: string;

  @Column({ name: 'role_type', length: 100, nullable: false })
  role_type: string;

  @Column({ name: 'origin_from', type: 'uuid', nullable: true })
  origin_from: string;

  @Column({ name: 'order_no', type: 'int', default: 0 })
  order_no: number;
}
