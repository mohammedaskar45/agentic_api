import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: `${process.cwd()}/.env.${process.env.NODE_ENV || 'development'}` });

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `${process.cwd()}/.env.${process.env.NODE_ENV || 'development'}`,
        }),
    ],
})
export class DatabaseConfig {
    public getTypeOrmConfig(): TypeOrmModuleOptions {
        return {
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432,
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PWD || 'postgres',
            database: process.env.DB_NAME || 'compliance_db',
            autoLoadEntities: true,
            synchronize: true,
        };
    }
}

export const config = new DatabaseConfig().getTypeOrmConfig();
