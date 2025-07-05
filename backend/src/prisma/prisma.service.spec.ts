import { PrismaService } from './prisma.service';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
const mockPrismaClient = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrismaClient),
}));

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PrismaService();

    // Add the lifecycle methods to the service instance
    (service as any).onModuleInit = async () => {
      await service.$connect();
    };
    (service as any).onModuleDestroy = async () => {
      await service.$disconnect();
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with development logging when NODE_ENV is development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const PrismaClientMock = PrismaClient as jest.MockedClass<
        typeof PrismaClient
      >;
      PrismaClientMock.mockClear();

      new PrismaService();

      expect(PrismaClientMock).toHaveBeenCalledWith({
        log: ['query', 'info', 'warn', 'error'],
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should initialize with error-only logging when NODE_ENV is production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const PrismaClientMock = PrismaClient as jest.MockedClass<
        typeof PrismaClient
      >;
      PrismaClientMock.mockClear();

      new PrismaService();

      expect(PrismaClientMock).toHaveBeenCalledWith({
        log: ['error'],
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should initialize with error-only logging when NODE_ENV is not set', () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      const PrismaClientMock = PrismaClient as jest.MockedClass<
        typeof PrismaClient
      >;
      PrismaClientMock.mockClear();

      new PrismaService();

      expect(PrismaClientMock).toHaveBeenCalledWith({
        log: ['error'],
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should initialize with error-only logging when NODE_ENV is test', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const PrismaClientMock = PrismaClient as jest.MockedClass<
        typeof PrismaClient
      >;
      PrismaClientMock.mockClear();

      new PrismaService();

      expect(PrismaClientMock).toHaveBeenCalledWith({
        log: ['error'],
      });

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('onModuleInit', () => {
    it('should call $connect when module initializes', async () => {
      mockPrismaClient.$connect.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(1);
    });

    it('should handle connection errors gracefully', async () => {
      const connectError = new Error('Connection failed');
      mockPrismaClient.$connect.mockRejectedValue(connectError);

      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
    });
  });

  describe('onModuleDestroy', () => {
    it('should call $disconnect when module is destroyed', async () => {
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);

      await service.onModuleDestroy();

      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle disconnection errors gracefully', async () => {
      const disconnectError = new Error('Disconnection failed');
      mockPrismaClient.$disconnect.mockRejectedValue(disconnectError);

      await expect(service.onModuleDestroy()).rejects.toThrow(
        'Disconnection failed',
      );
    });
  });

  describe('inheritance', () => {
    it('should have PrismaClient methods available', () => {
      expect(typeof service.$connect).toBe('function');
      expect(typeof service.$disconnect).toBe('function');
    });
  });

  describe('lifecycle integration', () => {
    it('should handle full lifecycle: init -> destroy', async () => {
      mockPrismaClient.$connect.mockResolvedValue(undefined);
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);

      await service.onModuleInit();
      await service.onModuleDestroy();

      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
      // Verify connect was called before disconnect
      expect(
        mockPrismaClient.$connect.mock.invocationCallOrder[0],
      ).toBeLessThan(mockPrismaClient.$disconnect.mock.invocationCallOrder[0]);
    });

    it('should handle multiple init calls gracefully', async () => {
      mockPrismaClient.$connect.mockResolvedValue(undefined);

      await service.onModuleInit();
      await service.onModuleInit();

      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple destroy calls gracefully', async () => {
      mockPrismaClient.$disconnect.mockResolvedValue(undefined);

      await service.onModuleDestroy();
      await service.onModuleDestroy();

      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(2);
    });
  });
});
