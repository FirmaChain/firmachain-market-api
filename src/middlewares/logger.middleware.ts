import {
  Injectable,
  Logger,
  NestMiddleware,
  LoggerService,
  Inject
} from '@nestjs/common';

import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(@Inject(Logger) private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const method = req.method;
    const originalUrl = req.originalUrl;
    const userAgent = req.get('user-agent');

    res.on('finish', () => {
      const { statusCode } = res;
      const timestamp = new Date().toISOString();
      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${ip} ${userAgent} ${timestamp}`,
      );
    });

    next();
  }
}