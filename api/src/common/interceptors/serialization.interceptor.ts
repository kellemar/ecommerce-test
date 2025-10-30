import { Collection, Utils, wrap } from '@mikro-orm/core';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

function serializeValue(value: unknown): unknown {
  if (value instanceof Collection) {
    if (!value.isInitialized()) {
      return [];
    }
    return value.getItems().map((item) => serializeValue(item));
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeValue(item));
  }

  if (value && typeof value === 'object') {
    if (Utils.isEntity(value)) {
      return serializeValue(wrap(value).toObject());
    }

    return Object.entries(value).reduce<Record<string, unknown>>(
      (acc, [key, val]) => {
        acc[key] = serializeValue(val);
        return acc;
      },
      {},
    );
  }

  return value;
}

@Injectable()
export class SerializationInterceptor implements NestInterceptor {
  intercept(_: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((value) => serializeValue(value)));
  }
}
