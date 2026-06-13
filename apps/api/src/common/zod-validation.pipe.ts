import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ZodError } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown) {
    return value;
  }
}

export function handleZodError(err: unknown): never {
  if (err instanceof ZodError) {
    throw new BadRequestException({
      message: 'Validation error',
      errors: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
  }
  throw err;
}
