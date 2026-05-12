import { Entity, PrimaryColumn, Column, Generated, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/helpers/base.entity';
import { User } from './users.entity';
import { Company } from './companies.entity';

@Entity({ name: 'user_company_mapping' })
export class UserCompanyMapping extends BaseEntity {
  @PrimaryColumn({ type: 'uuid' })
  @Generated('uuid')
  mapping_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  user_id: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'company_id', type: 'uuid' })
  company_id: string;

  @Column({ name: 'is_primary', default: false })
  is_primary: boolean;
}
