import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Environment variable validation
function requireEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getEnvVar(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}

// Database configuration
export const databaseConfig = {
  url: getEnvVar('DATABASE_URL', 'file:./dev.db'),
};

// Application configuration
export const appConfig = {
  nodeEnv: getEnvVar('NODE_ENV', 'development') || 'development',
  port: parseInt(getEnvVar('PORT', '3000') || '3000', 10),
  logLevel: getEnvVar('LOG_LEVEL', 'info') || 'info',
};

// Scraping configuration
export const scraperConfig = {
  delay: parseInt(getEnvVar('SCRAPER_DELAY', '2000') || '2000', 10),
  maxPages: parseInt(getEnvVar('SCRAPER_MAX_PAGES', '5') || '5', 10),
  headless: getEnvVar('SCRAPER_HEADLESS', 'true') === 'true',
};

// Security configuration
export const securityConfig = {
  jwtSecret: getEnvVar('JWT_SECRET', 'your_jwt_secret_here'),
  sessionSecret: getEnvVar('SESSION_SECRET', 'your_session_secret_here'),
};

// API Keys (optional)
export const apiKeys = {
  remoteok: getEnvVar('REMOTEOK_API_KEY'),
  linkedin: getEnvVar('LINKEDIN_API_KEY'),
  indeed: getEnvVar('INDEED_API_KEY'),
};

// External services (optional)
export const externalServices = {
  redis: getEnvVar('REDIS_URL'),
  aws: {
    accessKeyId: getEnvVar('AWS_ACCESS_KEY_ID'),
    secretAccessKey: getEnvVar('AWS_SECRET_ACCESS_KEY'),
    region: getEnvVar('AWS_REGION', 'us-east-1'),
  },
};

// Email configuration (optional)
export const emailConfig = {
  host: getEnvVar('SMTP_HOST'),
  port: parseInt(getEnvVar('SMTP_PORT', '587') || '587', 10),
  user: getEnvVar('SMTP_USER'),
  pass: getEnvVar('SMTP_PASS'),
};

// Validation function to check if all required environment variables are set
export function validateEnvironment(): void {
  const requiredVars: string[] = [];
  
  // Add any required environment variables here
  // Example: requiredVars.push('DATABASE_URL');
  
  for (const envVar of requiredVars) {
    requireEnvVar(envVar);
  }
  
  console.log('✅ Environment variables validated successfully');
}

// Export a function to get all configuration
export function getConfig() {
  return {
    database: databaseConfig,
    app: appConfig,
    scraper: scraperConfig,
    security: securityConfig,
    apiKeys,
    externalServices,
    email: emailConfig,
  };
}

// Development helper to print current configuration (without secrets)
export function printConfig(): void {
  const config = getConfig();
  
  console.log('📋 Current Configuration:');
  console.log('Database:', { url: config.database.url });
  console.log('App:', config.app);
  console.log('Scraper:', config.scraper);
  console.log('Security:', { 
    jwtSecret: config.security.jwtSecret ? '[SET]' : '[NOT SET]',
    sessionSecret: config.security.sessionSecret ? '[SET]' : '[NOT SET]'
  });
  console.log('API Keys:', {
    remoteok: config.apiKeys.remoteok ? '[SET]' : '[NOT SET]',
    linkedin: config.apiKeys.linkedin ? '[SET]' : '[NOT SET]',
    indeed: config.apiKeys.indeed ? '[SET]' : '[NOT SET]'
  });
} 