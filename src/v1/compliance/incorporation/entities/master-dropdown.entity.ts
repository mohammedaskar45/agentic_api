import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('master_dropdowns')
export class MasterDropdown {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  category: string;

  @Column()
  label: string;

  @Column()
  value: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;
}
