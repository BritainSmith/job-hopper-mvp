import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getHealth', () => {
    it('should return health status with timestamp', () => {
      const result = controller.getHealth();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result.status).toBe('ok');
      expect(typeof result.timestamp).toBe('string');
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should return valid ISO timestamp', () => {
      const result = controller.getHealth();
      const timestamp = new Date(result.timestamp);

      expect(timestamp.getTime()).not.toBeNaN();
      expect(result.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });
  });
});
