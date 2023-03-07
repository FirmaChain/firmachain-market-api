import { utilities, WinstonModule } from "nest-winston";
import winstonDaily from 'winston-daily-rotate-file';
import * as winston from 'winston';

const env = process.env.NODE_ENV;
const logDir = __dirname + '../../../logs';

const transportOptions = (level: string) => {
  return {
    level,
    datePattern: 'YYYY-MM-DD',
    dirname: logDir + `/${level}`,
    fileName: `%DATE%.${level}.log`,
    maxFiles: 30,
    zippedArchive: true
  }
};

export const winstonLogger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      level: env === 'prod' ? 'http' : 'silly',
      format: env === 'prod' ? winston.format.simple()
        : winston.format.combine(
            winston.format.timestamp(),
            utilities.format.nestLike('firmachain-market-api', {
              prettyPrint: true
            })
          )
    }),
    new winstonDaily(transportOptions('info')),
    new winstonDaily(transportOptions('warn')),
    new winstonDaily(transportOptions('error')),
  ]
});