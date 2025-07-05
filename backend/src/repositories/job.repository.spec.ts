import { Test, TestingModule } from '@nestjs/testing';
import { JobRepository } from './job.repository';
import { PrismaService } from '../prisma/prisma.service';
import { Job } from '@prisma/client';

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

  const mockJob: Job = {
    id: 1,
    title: 'Software Engineer',
    company: 'TestCo',
    location: 'Remote',
    applyLink: 'https://example.com/job',
    status: 'ACTIVE',
    applied: false,
    appliedAt: null,
    dateScraped: new Date('2023-01-01'),
    lastUpdated: new Date('2023-01-01'),
    searchText: 'software engineer remote',
    source: 'remoteok',
    tags: 'typescript,react',
    salary: '100k-150k',
    postedDate: '2d ago',
    companyId: null,
  };

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
    const data = {
      title: 'Test',
      company: 'TestCo',
      location: 'Remote',
      applyLink: 'link',
      status: 'ACTIVE',
      applied: false,
      dateScraped: new Date(),
      lastUpdated: new Date(),
      searchText: 'test',
      source: 'remoteok',
    };
    await repository.createJob(data as any);
    expect(prisma.job.create).toHaveBeenCalledWith({ data });
  });

  describe('createJob', () => {
    it('should create a new job', async () => {
      const jobData = {
        title: 'Test Job',
        company: 'TestCo',
        location: 'Remote',
        applyLink: 'https://example.com/job',
        status: 'ACTIVE' as const,
        applied: false,
        dateScraped: new Date(),
        lastUpdated: new Date(),
        searchText: 'test job',
        source: 'remoteok',
      };

      mockPrismaService.job.create.mockResolvedValue(mockJob);

      const result = await repository.createJob(jobData);

      expect(prisma.job.create).toHaveBeenCalledWith({ data: jobData });
      expect(result).toEqual(mockJob);
    });

    it('should handle create job errors', async () => {
      const jobData = { title: 'Test' } as any;
      const error = new Error('Database error');
      mockPrismaService.job.create.mockRejectedValue(error);

      await expect(repository.createJob(jobData)).rejects.toThrow(
        'Database error',
      );
      expect(prisma.job.create).toHaveBeenCalledWith({ data: jobData });
    });
  });

  describe('getJobById', () => {
    it('should return a job when found', async () => {
      mockPrismaService.job.findUnique.mockResolvedValue(mockJob);

      const result = await repository.getJobById(1);

      expect(prisma.job.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockJob);
    });

    it('should return null when job not found', async () => {
      mockPrismaService.job.findUnique.mockResolvedValue(null);

      const result = await repository.getJobById(999);

      expect(prisma.job.findUnique).toHaveBeenCalledWith({
        where: { id: 999 },
      });
      expect(result).toBeNull();
    });

    it('should handle get job by id errors', async () => {
      const error = new Error('Database error');
      mockPrismaService.job.findUnique.mockRejectedValue(error);

      await expect(repository.getJobById(1)).rejects.toThrow('Database error');
      expect(prisma.job.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('getJobs', () => {
    it('should return jobs with no filters', async () => {
      const mockJobs = [mockJob];
      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);

      const result = await repository.getJobs();

      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: {
          company: undefined,
          location: undefined,
          status: undefined,
          applied: undefined,
          source: undefined,
          tags: undefined,
          searchText: undefined,
        },
        skip: undefined,
        take: undefined,
        orderBy: undefined,
      });
      expect(result).toEqual(mockJobs);
    });

    it('should return jobs with company filter', async () => {
      const mockJobs = [mockJob];
      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);

      const result = await repository.getJobs({ company: 'TestCo' });

      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: {
          company: 'TestCo',
          location: undefined,
          status: undefined,
          applied: undefined,
          source: undefined,
          tags: undefined,
          searchText: undefined,
        },
        skip: undefined,
        take: undefined,
        orderBy: undefined,
      });
      expect(result).toEqual(mockJobs);
    });

    it('should return jobs with location filter', async () => {
      const mockJobs = [mockJob];
      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);

      const result = await repository.getJobs({ location: 'Remote' });

      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: {
          company: undefined,
          location: 'Remote',
          status: undefined,
          applied: undefined,
          source: undefined,
          tags: undefined,
          searchText: undefined,
        },
        skip: undefined,
        take: undefined,
        orderBy: undefined,
      });
      expect(result).toEqual(mockJobs);
    });

    it('should return jobs with status filter', async () => {
      const mockJobs = [mockJob];
      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);

      const result = await repository.getJobs({ status: 'ACTIVE' });

      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: {
          company: undefined,
          location: undefined,
          status: 'ACTIVE',
          applied: undefined,
          source: undefined,
          tags: undefined,
          searchText: undefined,
        },
        skip: undefined,
        take: undefined,
        orderBy: undefined,
      });
      expect(result).toEqual(mockJobs);
    });

    it('should return jobs with applied filter', async () => {
      const mockJobs = [mockJob];
      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);

      const result = await repository.getJobs({ applied: true });

      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: {
          company: undefined,
          location: undefined,
          status: undefined,
          applied: true,
          source: undefined,
          tags: undefined,
          searchText: undefined,
        },
        skip: undefined,
        take: undefined,
        orderBy: undefined,
      });
      expect(result).toEqual(mockJobs);
    });

    it('should return jobs with source filter', async () => {
      const mockJobs = [mockJob];
      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);

      const result = await repository.getJobs({ source: 'remoteok' });

      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: {
          company: undefined,
          location: undefined,
          status: undefined,
          applied: undefined,
          source: 'remoteok',
          tags: undefined,
          searchText: undefined,
        },
        skip: undefined,
        take: undefined,
        orderBy: undefined,
      });
      expect(result).toEqual(mockJobs);
    });

    it('should return jobs with tags filter', async () => {
      const mockJobs = [mockJob];
      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);

      const result = await repository.getJobs({
        tags: ['typescript', 'react'],
      });

      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: {
          company: undefined,
          location: undefined,
          status: undefined,
          applied: undefined,
          source: undefined,
          tags: { contains: 'typescript,react' },
          searchText: undefined,
        },
        skip: undefined,
        take: undefined,
        orderBy: undefined,
      });
      expect(result).toEqual(mockJobs);
    });

    it('should return jobs with search text filter', async () => {
      const mockJobs = [mockJob];
      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);

      const result = await repository.getJobs({
        searchText: 'software engineer',
      });

      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: {
          company: undefined,
          location: undefined,
          status: undefined,
          applied: undefined,
          source: undefined,
          tags: undefined,
          searchText: { contains: 'software engineer' },
        },
        skip: undefined,
        take: undefined,
        orderBy: undefined,
      });
      expect(result).toEqual(mockJobs);
    });

    it('should return jobs with pagination options', async () => {
      const mockJobs = [mockJob];
      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);

      const result = await repository.getJobs(
        {},
        { skip: 10, take: 20, orderBy: { dateScraped: 'desc' } },
      );

      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: {
          company: undefined,
          location: undefined,
          status: undefined,
          applied: undefined,
          source: undefined,
          tags: undefined,
          searchText: undefined,
        },
        skip: 10,
        take: 20,
        orderBy: { dateScraped: 'desc' },
      });
      expect(result).toEqual(mockJobs);
    });

    it('should return jobs with all filters combined', async () => {
      const mockJobs = [mockJob];
      mockPrismaService.job.findMany.mockResolvedValue(mockJobs);

      const result = await repository.getJobs(
        {
          company: 'TestCo',
          location: 'Remote',
          status: 'ACTIVE',
          applied: false,
          source: 'remoteok',
          tags: ['typescript'],
          searchText: 'engineer',
        },
        { skip: 0, take: 10 },
      );

      expect(prisma.job.findMany).toHaveBeenCalledWith({
        where: {
          company: 'TestCo',
          location: 'Remote',
          status: 'ACTIVE',
          applied: false,
          source: 'remoteok',
          tags: { contains: 'typescript' },
          searchText: { contains: 'engineer' },
        },
        skip: 0,
        take: 10,
        orderBy: undefined,
      });
      expect(result).toEqual(mockJobs);
    });

    it('should handle get jobs errors', async () => {
      const error = new Error('Database error');
      mockPrismaService.job.findMany.mockRejectedValue(error);

      await expect(repository.getJobs()).rejects.toThrow('Database error');
    });
  });

  describe('updateJob', () => {
    it('should update a job successfully', async () => {
      const updateData = { title: 'Updated Job Title' };
      const updatedJob = { ...mockJob, ...updateData };
      mockPrismaService.job.update.mockResolvedValue(updatedJob);

      const result = await repository.updateJob(1, updateData);

      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });
      expect(result).toEqual(updatedJob);
    });

    it('should handle update job errors', async () => {
      const updateData = { title: 'Updated Job Title' };
      const error = new Error('Database error');
      mockPrismaService.job.update.mockRejectedValue(error);

      await expect(repository.updateJob(1, updateData)).rejects.toThrow(
        'Database error',
      );
      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });
    });
  });

  describe('deleteJob', () => {
    it('should delete a job successfully', async () => {
      mockPrismaService.job.delete.mockResolvedValue(mockJob);

      const result = await repository.deleteJob(1);

      expect(prisma.job.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockJob);
    });

    it('should handle delete job errors', async () => {
      const error = new Error('Database error');
      mockPrismaService.job.delete.mockRejectedValue(error);

      await expect(repository.deleteJob(1)).rejects.toThrow('Database error');
      expect(prisma.job.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });

  describe('upsertJob', () => {
    it('should create a new job when it does not exist', async () => {
      const jobData = {
        title: 'New Job',
        company: 'NewCo',
        location: 'Remote',
        applyLink: 'https://newco.com/job',
        status: 'ACTIVE' as const,
        applied: false,
        dateScraped: new Date(),
        lastUpdated: new Date(),
        searchText: 'new job',
        source: 'remoteok',
      };

      mockPrismaService.job.upsert.mockResolvedValue(mockJob);

      const result = await repository.upsertJob(jobData);

      expect(prisma.job.upsert).toHaveBeenCalledWith({
        where: { applyLink: jobData.applyLink },
        update: jobData,
        create: jobData,
      });
      expect(result).toEqual(mockJob);
    });

    it('should update an existing job when it exists', async () => {
      const jobData = {
        title: 'Updated Job',
        company: 'TestCo',
        location: 'Remote',
        applyLink: 'https://example.com/job',
        status: 'ACTIVE' as const,
        applied: true,
        dateScraped: new Date(),
        lastUpdated: new Date(),
        searchText: 'updated job',
        source: 'remoteok',
      };

      const updatedJob = { ...mockJob, ...jobData };
      mockPrismaService.job.upsert.mockResolvedValue(updatedJob);

      const result = await repository.upsertJob(jobData);

      expect(prisma.job.upsert).toHaveBeenCalledWith({
        where: { applyLink: jobData.applyLink },
        update: jobData,
        create: jobData,
      });
      expect(result).toEqual(updatedJob);
    });

    it('should handle upsert job errors', async () => {
      const jobData = { title: 'Test' } as any;
      const error = new Error('Database error');
      mockPrismaService.job.upsert.mockRejectedValue(error);

      await expect(repository.upsertJob(jobData)).rejects.toThrow(
        'Database error',
      );
      expect(prisma.job.upsert).toHaveBeenCalledWith({
        where: { applyLink: jobData.applyLink },
        update: jobData,
        create: jobData,
      });
    });
  });

  describe('getJobStats', () => {
    it('should return job statistics', async () => {
      const mockStats = {
        total: 100,
        applied: 25,
        notApplied: 75,
        byStatus: {
          ACTIVE: 60,
          CLOSED: 30,
          EXPIRED: 10,
        },
      };

      mockPrismaService.job.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(25) // applied
        .mockResolvedValueOnce(75); // not applied

      mockPrismaService.job.groupBy.mockResolvedValue([
        { status: 'ACTIVE', _count: { status: 60 } },
        { status: 'CLOSED', _count: { status: 30 } },
        { status: 'EXPIRED', _count: { status: 10 } },
      ]);

      const result = await repository.getJobStats();

      expect(prisma.job.count).toHaveBeenCalledTimes(3);
      // Check that all expected calls were made (order doesn't matter due to Promise.all)
      const calls = mockPrismaService.job.count.mock.calls;
      expect(calls).toContainEqual([]); // no arguments
      expect(calls).toContainEqual([{ where: { applied: true } }]);
      expect(calls).toContainEqual([{ where: { applied: false } }]);
      expect(prisma.job.groupBy).toHaveBeenCalledWith({
        by: ['status'],
        _count: { status: true },
      });
      expect(result).toEqual(mockStats);
    });

    it('should handle job statistics with null status values', async () => {
      mockPrismaService.job.count
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(10) // applied
        .mockResolvedValueOnce(40); // not applied

      mockPrismaService.job.groupBy.mockResolvedValue([
        { status: 'ACTIVE', _count: { status: 30 } },
        { status: null, _count: { status: 20 } },
      ]);

      const result = await repository.getJobStats();

      expect(result).toEqual({
        total: 50,
        applied: 10,
        notApplied: 40,
        byStatus: {
          ACTIVE: 30,
          unknown: 20,
        },
      });
    });

    it('should handle empty job statistics', async () => {
      mockPrismaService.job.count
        .mockResolvedValueOnce(0) // total
        .mockResolvedValueOnce(0) // applied
        .mockResolvedValueOnce(0); // not applied

      mockPrismaService.job.groupBy.mockResolvedValue([]);

      const result = await repository.getJobStats();

      expect(result).toEqual({
        total: 0,
        applied: 0,
        notApplied: 0,
        byStatus: {},
      });
    });

    it('should handle get job stats errors', async () => {
      const error = new Error('Database error');
      mockPrismaService.job.count.mockRejectedValue(error);

      await expect(repository.getJobStats()).rejects.toThrow('Database error');
    });
  });
});
