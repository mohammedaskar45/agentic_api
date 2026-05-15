import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuybackService } from './buyback.service';
import { BuybackController } from './buyback.controller';
import { Buyback, BuybackMasterData } from './entities/buyback.entity';
import { Incorporation } from '../incorporation/entities/incorporation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Buyback, BuybackMasterData, Incorporation])],
  providers: [BuybackService],
  controllers: [BuybackController],
  exports: [BuybackService],
})
export class BuybackModule {}
