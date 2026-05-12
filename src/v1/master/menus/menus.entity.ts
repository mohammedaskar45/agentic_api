import { Entity, PrimaryColumn, Column, Generated, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/helpers/base.entity';
import { MenuType } from 'src/helpers/keywords';

@Entity({ name: 'menus' })
export class Menu extends BaseEntity {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  menu_id: string;

  @Column({ name: 'menu_name', length: 255, nullable: false })
  menu_name: string;

  @Column({ name: 'menu_type', enum: MenuType, default: MenuType.Admin, nullable: false })
  menu_type: string;

  @Column({ name: 'url', length: 255, nullable: false })
  url: string;

  @Column({ name: 'icon', type: 'text', nullable: false })
  icon: string;

  @Column({ name: 'order_no', type: 'int', default: 0, nullable: false })
  order_no: number;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parent_id: string;

  @ManyToOne(() => Menu, (menu) => menu.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent: Menu;

  @OneToMany(() => Menu, (menu) => menu.parent)
  children: Menu[];
}
