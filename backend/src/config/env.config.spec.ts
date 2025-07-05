import { databaseConfig, appConfig, scraperConfig, securityConfig, apiKeysConfig, externalServicesConfig, emailConfig } from './env.config';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('databaseConfig', () => {
    it('should return default database URL when DATABASE_URL is not set', () => {
      delete process.env.DATABASE_URL;
      const config = databaseConfig();
      expect(config.url).toBe('file:./dev.db');
    });

    it('should return custom database URL when DATABASE_URL is set', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      const config = databaseConfig();
      expect(config.url).toBe('postgresql://user:pass@localhost:5432/db');
    });
  });

  describe('appConfig', () => {
    it('should return default app configuration when no env vars are set', () => {
      delete process.env.NODE_ENV;
      delete process.env.PORT;
      delete process.env.LOG_LEVEL;
      
      const config = appConfig();
      expect(config.nodeEnv).toBe('development');
      expect(config.port).toBe(3000);
      expect(config.logLevel).toBe('info');
    });

    it('should return custom app configuration when env vars are set', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '8080';
      process.env.LOG_LEVEL = 'debug';
      
      const config = appConfig();
      expect(config.nodeEnv).toBe('production');
      expect(config.port).toBe(8080);
      expect(config.logLevel).toBe('debug');
    });

    it('should parse port as integer', () => {
      process.env.PORT = '5000';
      const config = appConfig();
      expect(config.port).toBe(5000);
      expect(typeof config.port).toBe('number');
    });
  });

  describe('scraperConfig', () => {
    it('should return default scraper configuration when no env vars are set', () => {
      delete process.env.SCRAPER_DELAY;
      delete process.env.SCRAPER_MAX_PAGES;
      delete process.env.SCRAPER_HEADLESS;
      
      const config = scraperConfig();
      expect(config.delay).toBe(2000);
      expect(config.maxPages).toBe(5);
      expect(config.headless).toBe(false);
    });

    it('should return custom scraper configuration when env vars are set', () => {
      process.env.SCRAPER_DELAY = '5000';
      process.env.SCRAPER_MAX_PAGES = '10';
      process.env.SCRAPER_HEADLESS = 'true';
      
      const config = scraperConfig();
      expect(config.delay).toBe(5000);
      expect(config.maxPages).toBe(10);
      expect(config.headless).toBe(true);
    });

    it('should parse numeric values correctly', () => {
      process.env.SCRAPER_DELAY = '3000';
      process.env.SCRAPER_MAX_PAGES = '7';
      
      const config = scraperConfig();
      expect(config.delay).toBe(3000);
      expect(config.maxPages).toBe(7);
      expect(typeof config.delay).toBe('number');
      expect(typeof config.maxPages).toBe('number');
    });

    it('should handle headless as boolean', () => {
      process.env.SCRAPER_HEADLESS = 'false';
      const config = scraperConfig();
      expect(config.headless).toBe(false);
    });
  });

  describe('securityConfig', () => {
    it('should return default security configuration when no env vars are set', () => {
      delete process.env.JWT_SECRET;
      delete process.env.SESSION_SECRET;
      
      const config = securityConfig();
      expect(config.jwtSecret).toBe('your_jwt_secret_here');
      expect(config.sessionSecret).toBe('your_session_secret_here');
    });

    it('should return custom security configuration when env vars are set', () => {
      process.env.JWT_SECRET = 'custom_jwt_secret';
      process.env.SESSION_SECRET = 'custom_session_secret';
      
      const config = securityConfig();
      expect(config.jwtSecret).toBe('custom_jwt_secret');
      expect(config.sessionSecret).toBe('custom_session_secret');
    });
  });

  describe('apiKeysConfig', () => {
    it('should return undefined API keys when not set', () => {
      delete process.env.REMOTEOK_API_KEY;
      delete process.env.LINKEDIN_API_KEY;
      delete process.env.INDEED_API_KEY;
      
      const config = apiKeysConfig();
      expect(config.remoteok).toBeUndefined();
      expect(config.linkedin).toBeUndefined();
      expect(config.indeed).toBeUndefined();
    });

    it('should return API keys when set', () => {
      process.env.REMOTEOK_API_KEY = 'remoteok_key';
      process.env.LINKEDIN_API_KEY = 'linkedin_key';
      process.env.INDEED_API_KEY = 'indeed_key';
      
      const config = apiKeysConfig();
      expect(config.remoteok).toBe('remoteok_key');
      expect(config.linkedin).toBe('linkedin_key');
      expect(config.indeed).toBe('indeed_key');
    });
  });

  describe('externalServicesConfig', () => {
    it('should return default external services configuration when no env vars are set', () => {
      delete process.env.REDIS_URL;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;
      delete process.env.AWS_REGION;
      
      const config = externalServicesConfig();
      expect(config.redis).toBeUndefined();
      expect(config.aws.accessKeyId).toBeUndefined();
      expect(config.aws.secretAccessKey).toBeUndefined();
      expect(config.aws.region).toBe('us-east-1');
    });

    it('should return custom external services configuration when env vars are set', () => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      process.env.AWS_ACCESS_KEY_ID = 'aws_key';
      process.env.AWS_SECRET_ACCESS_KEY = 'aws_secret';
      process.env.AWS_REGION = 'eu-west-1';
      
      const config = externalServicesConfig();
      expect(config.redis).toBe('redis://localhost:6379');
      expect(config.aws.accessKeyId).toBe('aws_key');
      expect(config.aws.secretAccessKey).toBe('aws_secret');
      expect(config.aws.region).toBe('eu-west-1');
    });
  });

  describe('emailConfig', () => {
    it('should return default email configuration when no env vars are set', () => {
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      
      const config = emailConfig();
      expect(config.host).toBeUndefined();
      expect(config.port).toBe(587);
      expect(config.user).toBeUndefined();
      expect(config.pass).toBeUndefined();
    });

    it('should return custom email configuration when env vars are set', () => {
      process.env.SMTP_HOST = 'smtp.gmail.com';
      process.env.SMTP_PORT = '465';
      process.env.SMTP_USER = 'user@example.com';
      process.env.SMTP_PASS = 'password123';
      
      const config = emailConfig();
      expect(config.host).toBe('smtp.gmail.com');
      expect(config.port).toBe(465);
      expect(config.user).toBe('user@example.com');
      expect(config.pass).toBe('password123');
    });

    it('should parse port as integer', () => {
      process.env.SMTP_PORT = '2525';
      const config = emailConfig();
      expect(config.port).toBe(2525);
      expect(typeof config.port).toBe('number');
    });
  });
}); 