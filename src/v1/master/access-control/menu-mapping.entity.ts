import { Entity, PrimaryColumn, Column, Generated, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/helpers/base.entity';
import { Role } from './roles.entity';
import { Menu } from '../menus/menus.entity';

@Entity({ name: 'menu_mapping' })
export class MenuMapping extends BaseEntity {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  mapping_id: string;

  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ name: 'role_id', type: 'uuid' })
  role_id: string;

  @ManyToOne(() => Menu)
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;

  @Column({ name: 'menu_id', type: 'uuid' })
  menu_id: string;

  @Column({ name: 'full_access', default: false })
  full_access: boolean;

  @Column({ name: 'view', default: false })
  view: boolean;

  @Column({ name: 'add', default: false })
  add: boolean;

  @Column({ name: 'edit', default: false })
  edit: boolean;

  @Column({ name: 'delete', default: false })
  delete: boolean;
}
