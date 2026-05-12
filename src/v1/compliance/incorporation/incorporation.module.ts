import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncorporationController } from './incorporation.controller';
import { IncorporationService } from './incorporation.service';
import { Incorporation } from './entities/incorporation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Incorporation])],
  controllers: [IncorporationController],
  providers: [IncorporationService],
  exports: [IncorporationService],
})
export class IncorporationModule {}
