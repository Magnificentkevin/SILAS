import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  /** No auth on purpose -- an uptime monitor won't have a session, and this
   *  reveals nothing beyond "the database is reachable right now."
   *  Named /health, not /healthz -- the latter is a reserved path Google's
   *  Front End intercepts before it ever reaches Cloud Run, returning a
   *  Google-branded 404 that never touches this app at all. */
  @Get('health')
  checkHealth() {
    return this.appService.checkHealth();
  }
}
