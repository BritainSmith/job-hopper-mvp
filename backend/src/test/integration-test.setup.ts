import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationTestModule } from './integration-test.module';

export interface IntegrationTestContext {
  app: INestApplication;
  prisma: PrismaService;
  module: TestingModule;
}

export class IntegrationTestSetup {
  private static app: INestApplication;
  private static prisma: PrismaService;
  private static module: TestingModule;

  static async createTestingApp(): Promise<IntegrationTestContext> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [IntegrationTestModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    await app.init();

    const prisma = app.get<PrismaService>(PrismaService);

    this.app = app;
    this.prisma = prisma;
    this.module = moduleFixture;

    return { app, prisma, module: moduleFixture };
  }

  static async cleanupDatabase(): Promise<void> {
    if (this.prisma) {
      try {
        // Clean up all tables in reverse order of dependencies
        await this.prisma.job.deleteMany();
        await this.prisma.company.deleteMany();
        await this.prisma.scrapingSession.deleteMany();
      } catch (error: unknown) {
        // Ignore errors if tables don't exist yet
        let msg: string;
        if (
          typeof error === 'object' &&
          error !== null &&
          'message' in error &&
          typeof (error as Record<string, unknown>).message === 'string'
        ) {
          msg = (error as { message: string }).message;
        } else {
          msg = String(error);
        }
        console.log('Cleanup warning:', msg);
      }
    }
  }

  static async closeApp(): Promise<void> {
    if (this.app) {
      await this.cleanupDatabase();
      await this.app.close();
    }
  }

  static getPrisma(): PrismaService {
    return this.prisma;
  }

  static getApp(): INestApplication {
    return this.app;
  }
}
