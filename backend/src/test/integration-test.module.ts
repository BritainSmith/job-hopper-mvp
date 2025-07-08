import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { JobsModule } from '../jobs/jobs.module';
import { ScrapersModule } from '../scrapers/scrapers.module';
import { databaseConfig, appConfig } from '../config/env.config';
import { AIService } from '../services/ai.service';

// Mock AIService for integration tests
const mockAIService = {
  isAvailable: jest.fn().mockReturnValue(false),
  getStatus: jest.fn().mockReturnValue({
    available: false,
    model: 'gpt-4o-mini',
    configured: false,
  }),
  analyzeJob: jest.fn().mockResolvedValue({
    classification: {
      seniorityLevel: 'unknown',
      requiredSkills: [],
      remoteType: 'unknown',
      jobType: 'unknown',
      companySize: 'unknown',
      confidence: 0,
      reasoning: 'Mock AI service for integration tests',
    },
    processingTime: 0,
    costEstimate: 0,
  }),
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig],
      ignoreEnvFile: true,
    }),
    PrismaModule,
    JobsModule,
    ScrapersModule,
  ],
  providers: [
    {
      provide: AIService,
      useValue: mockAIService,
    },
  ],
})
export class IntegrationTestModule {}
