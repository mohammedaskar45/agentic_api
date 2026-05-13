import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessControlService } from './access-control.service';
import { AccessControlController } from './access-control.controller';
import { Role } from './roles.entity';
import { User } from './users.entity';
import { MenuMapping } from './menu-mapping.entity';
import { Menu } from '../menus/menus.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, User, MenuMapping, Menu]),
  ],
  providers: [AccessControlService],
  controllers: [AccessControlController],
  exports: [AccessControlService],
})
export class AccessControlModule {}
