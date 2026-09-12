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
  const STATIC_ALLOWED_ORIGINS = new Set([
    'https://silaserv.com',
    'https://staff.silaserv.com',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
  ]);
  // client-portal has no custom domain yet. A previous version of this
  // allowlist hardcoded one specific deployment's URL
  // (client-portal-mafd9r654-...) -- that's a frozen per-deployment
  // snapshot, not a live pointer, so it silently stopped matching the
  // moment client-portal redeployed. Vercel gives every project both a
  // stable alias (client-portal-<account>.vercel.app) and a fresh
  // hash-suffixed URL per deployment/preview -- match the whole family
  // instead of one snapshot of it.
  const CLIENT_PORTAL_VERCEL_ORIGIN = /^https:\/\/client-portal(-[a-z0-9]+)?-kevincomeau79-9646\.vercel\.app$/;
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || STATIC_ALLOWED_ORIGINS.has(origin) || CLIENT_PORTAL_VERCEL_ORIGIN.test(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
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
