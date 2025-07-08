import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AIService } from '../src/services/ai.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AIService)
      .useValue({
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
            reasoning: 'Mock AI service for e2e tests',
          },
          processingTime: 0,
          costEstimate: 0,
        }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
