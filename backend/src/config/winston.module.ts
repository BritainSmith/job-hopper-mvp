import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createLoggerConfig } from './logger.config';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        createLoggerConfig(configService),
      inject: [ConfigService],
    }),
  ],
})
export class WinstonConfigModule {}
