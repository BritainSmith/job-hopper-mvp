import { Test, TestingModule } from '@nestjs/testing';
import { JobRepository } from './job.repository';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  job: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
  },
};

describe('JobRepository', () => {
  let repository: JobRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<JobRepository>(JobRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should call prisma.job.create on createJob', async () => {
    const data = { title: 'Test', company: 'TestCo', location: 'Remote', applyLink: 'link', status: 'ACTIVE', applied: false, dateScraped: new Date(), lastUpdated: new Date(), searchText: 'test', source: 'remoteok' };
    await repository.createJob(data as any);
    expect(prisma.job.create).toHaveBeenCalledWith({ data });
  });
}); 