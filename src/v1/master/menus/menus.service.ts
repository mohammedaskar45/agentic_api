import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Menu } from './menus.entity';
import { MenuMapping } from '../access-control/menu-mapping.entity';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menu)
    private menuRepository: Repository<Menu>,
    @InjectRepository(MenuMapping)
    private menuMappingRepository: Repository<MenuMapping>,
  ) {}

  async getMenusByRole(role_id: string) {
    // 1. Get all menu mappings for this role that have 'view' permission
    const mappings = await this.menuMappingRepository.find({
      where: { role_id, view: true, is_deleted: 0 },
      select: ['menu_id'],
    });

    const menuIds = mappings.map((m) => m.menu_id);

    if (menuIds.length === 0) {
      return [];
    }

    // 2. Fetch menus based on these IDs
    const menus = await this.menuRepository.find({
      where: { menu_id: In(menuIds), is_deleted: 0, status: 'Active' },
      order: { order_no: 'ASC' },
    });

    // 3. Build tree structure (Parent-Child)
    return this.buildMenuTree(menus);
  }

  private buildMenuTree(menus: Menu[], parent_id: string | null = null): any[] {
    return menus
      .filter((menu) => menu.parent_id === parent_id)
      .map((menu) => ({
        ...menu,
        children: this.buildMenuTree(menus, menu.menu_id),
      }));
  }
}
