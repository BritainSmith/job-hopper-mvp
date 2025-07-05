import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';

export const createLoggerConfig = (configService: ConfigService) => {
  const isDevelopment = configService.get('NODE_ENV') === 'development';
  const logLevel = configService.get('LOG_LEVEL', 'info');

  // Define log format
  const logFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf((info: any) => {
      const { timestamp, level, message, stack, ...meta } = info;
      const logEntry: any = {
        timestamp,
        level,
        message,
        ...meta,
      };

      if (stack) {
        logEntry.stack = stack;
      }

      return JSON.stringify(logEntry);
    }),
  );

  // Console transport for development
  const consoleTransport = new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        const metaStr = Object.keys(meta).length
          ? JSON.stringify(meta, null, 2)
          : '';
        const stackStr = stack ? `\n${stack}` : '';
        return `${timestamp} [${level}]: ${message}${metaStr}${stackStr}`;
      }),
    ),
  });

  // File transports
  const fileTransports = [
    // Error logs
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ];

  // Development-specific transports
  if (isDevelopment) {
    fileTransports.push(
      new winston.transports.File({
        filename: 'logs/debug.log',
        level: 'debug',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 3,
      }),
    );
  }

  return {
    transports: [consoleTransport, ...fileTransports],
    level: logLevel,
    format: logFormat,
  };
};

// Custom logger instance for services
export const createServiceLogger = (serviceName: string) => {
  return winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    ),
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.printf(
            ({ timestamp, level, message, service, stack, ...meta }) => {
              const metaStr = Object.keys(meta).length
                ? JSON.stringify(meta, null, 2)
                : '';
              const stackStr = stack ? `\n${stack}` : '';
              return `${timestamp} [${level}] [${service}]: ${message}${metaStr}${stackStr}`;
            },
          ),
        ),
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
      }),
    ],
  });
};
