import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenusService } from './menus.service';
import { MenusController } from './menus.controller';
import { Menu } from './menus.entity';
import { MenuMapping } from '../access-control/menu-mapping.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Menu, MenuMapping])],
  providers: [MenusService],
  controllers: [MenusController],
  exports: [MenusService],
})
export class MenusModule {}
