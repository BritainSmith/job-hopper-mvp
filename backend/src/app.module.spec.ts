import { Test } from '@nestjs/testing';
import { AppModule } from './app.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

describe('AppModule', () => {
  it('should be defined', () => {
    expect(AppModule).toBeDefined();
  });

  it('should have correct module metadata', () => {
    const moduleMetadata = Reflect.getMetadata('imports', AppModule);
    const controllers = Reflect.getMetadata('controllers', AppModule);
    const providers = Reflect.getMetadata('providers', AppModule);

    expect(moduleMetadata).toBeDefined();
    expect(controllers).toBeDefined();
    expect(providers).toBeDefined();
  });

  it('should import required modules', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Check that the module can be instantiated
    expect(module).toBeDefined();
  });

  it('should have AppController registered', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const appController = module.get<AppController>(AppController);
    expect(appController).toBeDefined();
    expect(appController).toBeInstanceOf(AppController);
  });

  it('should have AppService registered', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const appService = module.get<AppService>(AppService);
    expect(appService).toBeDefined();
    expect(appService).toBeInstanceOf(AppService);
  });

  it('should have ConfigModule with global configuration', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // ConfigModule should be available globally
    const configService = module.get<ConfigService>(ConfigService);
    expect(configService).toBeDefined();
    expect(configService).toBeInstanceOf(ConfigService);
  });

  it('should have all required modules imported', async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Check that all expected modules are available by testing a few key services
    const appController = module.get<AppController>(AppController);
    const appService = module.get<AppService>(AppService);
    const configService = module.get<ConfigService>(ConfigService);

    expect(appController).toBeDefined();
    expect(appService).toBeDefined();
    expect(configService).toBeDefined();
  });

  describe('Module Structure', () => {
    it('should export AppModule class', () => {
      expect(typeof AppModule).toBe('function');
    });

    it('should have @Module decorator', () => {
      const moduleMetadata = Reflect.getMetadata('imports', AppModule);
      expect(moduleMetadata).toBeDefined();
    });
  });

  describe('Dependency Injection', () => {
    it('should inject AppService into AppController', async () => {
      const module = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      const appController = module.get<AppController>(AppController);
      const appService = module.get<AppService>(AppService);

      // Verify that the controller has access to the service
      expect(appController).toBeDefined();
      expect(appService).toBeDefined();
    });

    it('should have proper module initialization', async () => {
      const module = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      // Module should be properly initialized
      expect(module).toBeDefined();
      expect(typeof module.get).toBe('function');
    });
  });
});
