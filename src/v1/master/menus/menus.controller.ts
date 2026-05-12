import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { MenusService } from './menus.service';

@Controller('menus')
export class MenusController {
  constructor(private readonly menusService: MenusService) {}

  @Get('role/:role_id')
  async getMenus(@Param('role_id', ParseUUIDPipe) role_id: string) {
    const menus = await this.menusService.getMenusByRole(role_id);
    return {
      success: true,
      data: menus,
      message: 'Menus fetched successfully',
    };
  }
}
