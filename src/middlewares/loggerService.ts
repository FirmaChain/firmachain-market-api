import { LoggerService as LS } from '@nestjs/common';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import moment from 'moment';

const { errors, combine, json, timestamp, ms } = winston.format;

export class LoggerService implements LS {
  private logger: winston.Logger;

  constructor(service) {
    this.logger = winston.createLogger({
      format: combine(
        errors({ stack: true }),
        json(),
        timestamp({ format: 'isoDateTime' }),
        ms(),
      ),
      defaultMeta: { service },
      transports: [
        new winston.transports.Console({
          level: 'debug',
          format: combine(nestWinstonModuleUtilities.format.nestLike()),
        }),
        new winston.transports.File({
          filename: `${moment(new Date()).format('YYYY-MM-DD')}.log`,
          dirname: 'logs/info',
        }),
        new winston.transports.File({
          level: 'error',
          filename: `${moment(new Date()).format('YYYY-MM-DD')}.log`,
          dirname: 'logs/error/',
        }),
      ],
    });

    console.log = (message: any, params?: any) => {
      this.logger.debug(message, params);
    };
  }

  log(message: string) {
    this.logger.info(message);
  }
  error(message: string, trace: string) {
    this.logger.error(message, trace);
  }
  warn(message: string) {
    this.logger.warning(message);
  }
  debug(message: string) {
    this.logger.debug(message);
  }
  verbose(message: string) {
    this.logger.verbose(message);
  }
}