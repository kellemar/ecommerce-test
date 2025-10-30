import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MikroOrmMiddleware } from '@mikro-orm/nestjs';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SerializationInterceptor } from './common/interceptors/serialization.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(new Logger('NestApplication'));
  const mikroOrmMiddleware = app.get(MikroOrmMiddleware);
  app.use(mikroOrmMiddleware.use.bind(mikroOrmMiddleware));
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new SerializationInterceptor());

  const corsOrigins = process.env.ALLOWED_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
