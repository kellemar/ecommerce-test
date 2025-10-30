import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const payload = exception.getResponse();
      const message =
        typeof payload === 'string'
          ? payload
          : ((payload as Record<string, unknown>)?.['message'] ??
            exception.message);

      console.error('[HttpException]', {
        status,
        message,
        stack: exception.stack,
      });

      response.status(status).json({
        statusCode: status,
        path: request.url,
        timestamp: new Date().toISOString(),
        message,
      });
      return;
    }

    console.error('[Unknown Exception]', exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      path: request.url,
      timestamp: new Date().toISOString(),
      message: 'Internal server error',
    });
  }
}
