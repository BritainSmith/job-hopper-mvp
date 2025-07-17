import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorDetails = {};
    let validationErrors: Array<{
      field: string;
      message: string;
      value?: any;
    }> = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj.message as string) || exception.message;
        errorDetails = exceptionResponse;

        // Handle validation errors specifically
        if (exception instanceof BadRequestException && responseObj.message) {
          if (Array.isArray(responseObj.message)) {
            validationErrors = this.formatValidationErrors(
              responseObj.message as string[],
            );
            message = 'Validation failed';
          }
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      errorDetails = {
        name: exception.name,
        stack: exception.stack,
      };
    }

    // Log the error with context
    this.logger.error({
      message: 'Unhandled exception',
      error: message,
      statusCode: status,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      timestamp: new Date().toISOString(),
      details: errorDetails,
      validationErrors,
    });

    // Build error response
    const errorResponse: Record<string, unknown> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    };

    // Add validation errors if present
    if (validationErrors.length > 0) {
      errorResponse.validationErrors = validationErrors;
    }

    // Add detailed error information in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = errorDetails;
    }

    // Send error response
    response.status(status).json(errorResponse);
  }

  private formatValidationErrors(errors: string[]): Array<{
    field: string;
    message: string;
    value?: any;
  }> {
    return errors.map((error) => {
      // Extract field name from validation error message
      const fieldMatch = error.match(/^([^.]+)/);
      const field = fieldMatch ? fieldMatch[1] : 'unknown';

      return {
        field,
        message: error,
      };
    });
  }
}
