import { Entity, PrimaryColumn, Column, Generated } from 'typeorm';
import { BaseEntity } from 'src/helpers/base.entity';

@Entity({ name: 'cs_companies' })
export class Company extends BaseEntity {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  company_id: string;

  @Column({ name: 'company_name', length: 255, nullable: false })
  company_name: string;

  @Column({ name: 'cin_number', length: 21, unique: true, nullable: true })
  cin_number: string;

  @Column({ name: 'registration_number', length: 50, nullable: true })
  registration_number: string;

  @Column({ name: 'company_type', length: 100, nullable: true })
  company_type: string; // Private, Public, etc.

  @Column({ name: 'email', length: 255, nullable: true })
  email: string;
}
