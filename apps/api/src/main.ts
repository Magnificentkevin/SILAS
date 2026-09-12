import 'dotenv/config';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  // CsrfGuard is registered as an APP_GUARD provider in AuthModule instead
  // of here, so it goes through Nest's DI (it needs JwtService/Reflector).
  // Cloud Run sends SIGTERM on scale-down/redeploy with a short grace period
  // before SIGKILL -- without this, in-flight requests and the Prisma
  // connection pool aren't drained cleanly.
  app.enableShutdownHooks();
  app.useWebSocketAdapter(new IoAdapter(app));
  app.enableCors({
    origin: [
      'https://silaserv.com',
      'https://staff.silaserv.com',
      // client-portal has no custom domain yet (see docs/ops/tracker.md) —
      // this is its actual live Vercel URL, which the origin allowlist above
      // never included, so cross-origin calls from it were being CORS-blocked.
      'https://client-portal-mafd9r654-kevincomeau79-9646.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
    ],
    credentials: true,
  });

  await app.register(fastifyCookie);

  await app.register(fastifyMultipart, {
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB — a few minutes of compressed voice audio
  });
  // Voice notes are no longer served from local disk via an unauthenticated
  // static path -- they live in durable object storage (VoiceNoteStorageService)
  // behind GET /scans/:clientScanId/voice-note, which is authenticated and
  // ownership-checked before ever handing out a signed URL.

  await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
}
await bootstrap();
