import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, IsNull } from 'typeorm';
import { Role } from './roles.entity';
import { User } from './users.entity';
import { MenuMapping } from './menu-mapping.entity';
import { Menu } from '../menus/menus.entity';
import { UserCompanyMapping } from './user-company-mapping.entity';
import { InjectRepository as InjectRepo } from '@nestjs/typeorm';

@Injectable()
export class AccessControlService {
  constructor(
    @InjectRepo(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepo(User)
    private readonly userRepository: Repository<User>,
    @InjectRepo(MenuMapping)
    private readonly menuMappingRepository: Repository<MenuMapping>,
    @InjectRepo(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepo(UserCompanyMapping)
    private readonly userCompanyMappingRepository: Repository<UserCompanyMapping>,
  ) {}

  // ROLE CRUD
  async findAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({ order: { order_no: 'ASC' } });
  }

  async findOneRole(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { role_id: id } });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async createRole(roleData: Partial<Role>): Promise<Role> {
    const role = this.roleRepository.create(roleData);
    return this.roleRepository.save(role);
  }

  async updateRole(id: string, roleData: Partial<Role>): Promise<Role> {
    await this.roleRepository.update(id, roleData);
    return this.findOneRole(id);
  }

  async deleteRole(id: string): Promise<void> {
    await this.roleRepository.delete(id);
  }

  // USER CRUD
  async findAllUsers(companyId: string): Promise<User[]> {
    return this.userRepository.createQueryBuilder('user')
      .innerJoin('user_company_mapping', 'mapping', 'mapping.user_id = user.user_id')
      .where('mapping.company_id = :companyId', { companyId })
      .leftJoinAndSelect('user.role', 'role')
      .orderBy('user.created_on', 'DESC')
      .getMany();
  }

  async findOneUser(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ 
      where: { user_id: id },
      relations: ['role']
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createUser(userData: Partial<User>, companyId: string): Promise<User> {
    const user = this.userRepository.create(userData);
    const savedUser = await this.userRepository.save(user);

    // Map user to current company
    const mapping = this.userCompanyMappingRepository.create({
      user_id: savedUser.user_id,
      company_id: companyId,
      is_primary: true,
    });
    await this.userCompanyMappingRepository.save(mapping);

    return savedUser;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    await this.userRepository.update(id, userData);
    return this.findOneUser(id);
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  // MENU & PERMISSIONS
  async findAllMenus(): Promise<Menu[]> {
    return this.menuRepository.find({
      relations: ['children'],
      where: { parent_id: IsNull() },
      order: { order_no: 'ASC' },
    });
  }

  async getRolePermissions(roleId: string): Promise<MenuMapping[]> {
    return this.menuMappingRepository.find({
      where: { role_id: roleId },
      relations: ['menu'],
    });
  }

  async updateRolePermissions(roleId: string, mappings: Partial<MenuMapping>[]): Promise<void> {
    for (const mapping of mappings) {
      const { mapping_id, ...data } = mapping;
      if (mapping_id) {
        await this.menuMappingRepository.update(mapping_id, {
          ...data,
          role_id: roleId,
        });
      } else {
        const newMapping = this.menuMappingRepository.create({
          ...data,
          role_id: roleId,
        });
        await this.menuMappingRepository.save(newMapping);
      }
    }
  }
}
