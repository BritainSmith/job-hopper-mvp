import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL || 'file:./dev.db',
}));

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
}));

export const scraperConfig = registerAs('scraper', () => ({
  delay: parseInt(process.env.SCRAPER_DELAY || '2000', 10),
  maxPages: parseInt(process.env.SCRAPER_MAX_PAGES || '5', 10),
  headless: process.env.SCRAPER_HEADLESS === 'true',
}));

export const securityConfig = registerAs('security', () => ({
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_here',
  sessionSecret: process.env.SESSION_SECRET || 'your_session_secret_here',
}));

export const apiKeysConfig = registerAs('apiKeys', () => ({
  remoteok: process.env.REMOTEOK_API_KEY,
  linkedin: process.env.LINKEDIN_API_KEY,
  indeed: process.env.INDEED_API_KEY,
}));

export const externalServicesConfig = registerAs('externalServices', () => ({
  redis: process.env.REDIS_URL,
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
  },
}));

export const emailConfig = registerAs('email', () => ({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  user: process.env.SMTP_USER,
  pass: process.env.SMTP_PASS,
})); 