import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('v1/master/access-control')
@UseGuards(JwtAuthGuard)
export class AccessControlController {
  constructor(private readonly accessControlService: AccessControlService) {}

  // ROLES
  @Get('roles')
  async getAllRoles() {
    return this.accessControlService.findAllRoles();
  }

  @Post('roles')
  async createRole(@Body() roleData: any) {
    return this.accessControlService.createRole(roleData);
  }

  @Patch('roles/:id')
  async updateRole(@Param('id') id: string, @Body() roleData: any) {
    return this.accessControlService.updateRole(id, roleData);
  }

  @Delete('roles/:id')
  async deleteRole(@Param('id') id: string) {
    return this.accessControlService.deleteRole(id);
  }

  // USERS
  @Get('users')
  async getAllUsers() {
    return this.accessControlService.findAllUsers();
  }

  @Post('users')
  async createUser(@Body() userData: any) {
    return this.accessControlService.createUser(userData);
  }

  @Patch('users/:id')
  async updateUser(@Param('id') id: string, @Body() userData: any) {
    return this.accessControlService.updateUser(id, userData);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.accessControlService.deleteUser(id);
  }

  // MENUS & PERMISSIONS
  @Get('menus')
  async getAllMenus() {
    return this.accessControlService.findAllMenus();
  }

  @Get('permissions/:roleId')
  async getPermissions(@Param('roleId') roleId: string) {
    return this.accessControlService.getRolePermissions(roleId);
  }

  @Patch('permissions/:roleId')
  async updatePermissions(
    @Param('roleId') roleId: string,
    @Body() mappings: any[],
  ) {
    return this.accessControlService.updateRolePermissions(roleId, mappings);
  }
}
