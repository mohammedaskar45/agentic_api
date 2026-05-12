import { Entity, PrimaryColumn, Column, Generated, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/helpers/base.entity';
import { Role } from '../access-control/roles.entity';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  user_id: string;

  @Column({ name: 'name', length: 255, nullable: false })
  name: string;

  @Column({ name: 'first_name', length: 255, nullable: true })
  first_name: string;

  @Column({ name: 'last_name', length: 255, nullable: true })
  last_name: string;

  @Column({ name: 'mail_id', length: 255, unique: true, nullable: false })
  mail_id: string;

  @Column({ name: 'password', length: 255, nullable: false, select: false })
  password: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_id', type: 'uuid' })
  role_id: string;

  @Column({ name: 'user_type', length: 100, default: 'Admin' })
  user_type: string;

  @Column({ name: 'mobile_no', length: 20, nullable: true })
  mobile_no: string;
}
