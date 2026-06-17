import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ZodError } from 'zod';

/**
 * Maps an uncaught ZodError (e.g. from `Schema.parse(body)` in a controller)
 * to a 400 Bad Request instead of a 500. Keeps the same response shape as the
 * `handleZodError` helper so validation failures are consistent across the API.
 */
@Catch(ZodError)
export class ZodExceptionFilter implements ExceptionFilter {
  catch(err: ZodError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();
    res.status(400).json({
      statusCode: 400,
      message: 'Validation error',
      errors: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
  }
}
