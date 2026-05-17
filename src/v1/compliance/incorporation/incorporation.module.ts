import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncorporationController } from './incorporation.controller';
import { IncorporationService } from './incorporation.service';
import { Incorporation } from './entities/incorporation.entity';
import { IncorporationLog } from './entities/incorporation-log.entity';
import { MasterDropdown } from './entities/master-dropdown.entity';
import { IncMasterData } from './entities/inc-master-data.entity';
import { IncStakeholder } from './entities/inc-stakeholder.entity';
import { IncDsc, IncDin, IncRun } from './entities/inc-steps-basic.entity';
import { IncMoaAoa, IncSpice, IncCoi, IncCommencement } from './entities/inc-steps-advanced.entity';
import { IncBank, IncAgile } from './entities/inc-steps-final.entity';
import { IncAuditor } from './entities/inc-auditor.entity';
import { AIModule } from '../../master/ai/ai.module';

@Module({
  imports: [
    AIModule,
    TypeOrmModule.forFeature([
      Incorporation, 
      IncorporationLog, 
      MasterDropdown,
      IncMasterData,
      IncStakeholder,
      IncDsc,
      IncDin,
      IncRun,
      IncMoaAoa,
      IncSpice,
      IncCoi,
      IncCommencement,
      IncBank,
      IncAgile,
      IncAuditor
    ])
  ],
  controllers: [IncorporationController],
  providers: [IncorporationService],
  exports: [IncorporationService],
})
export class IncorporationModule {}
