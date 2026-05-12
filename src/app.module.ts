import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { config } from './config/db.config';
import { LoggerMiddleware } from './middleware/logging.middleware';
import { AuthModule } from './auth/auth.module';
import { MenusModule } from './v1/master/menus/menus.module';
import { IncorporationModule } from './v1/compliance/incorporation/incorporation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `${process.cwd()}/.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRoot(config),
    AuthModule,
    MenusModule,
    IncorporationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  constructor() {
    dotenv.config();
  }
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
