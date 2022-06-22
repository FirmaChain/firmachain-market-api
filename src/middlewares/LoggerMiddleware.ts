import { Injectable, NestMiddleware } from '@nestjs/common';
import moment from "moment";

import { Request, Response } from 'express';
import { LoggerService } from './loggerService';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor() {}
  use(req: Request, res: Response, next: Function) {
    const loggerService = new LoggerService(req.url.slice(1).split('/')[0]);
    const tempUrl = req.method + ' ' + req.url.split('?')[0];

    const _timestamp = JSON.stringify(moment().unix());
    const _headers = JSON.stringify(req.headers ? req.headers : {});
    const _query = JSON.stringify(req.query ? req.query : {});
    const _body = JSON.stringify(req.body ? req.body : {});
    const _url = JSON.stringify(tempUrl ? tempUrl : {});
    const _ip = JSON.stringify(req.ip ? req.ip : {});

    loggerService.log(`${_timestamp} ${_url} ${_headers} ${_query} ${_body} ${_ip}`.replace(/\\/, ''));
    next();
  }
}