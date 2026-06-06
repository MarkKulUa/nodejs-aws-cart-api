import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import serverlessExpress from '@codegenie/serverless-express';
import express from 'express';
import helmet from 'helmet';
import type {
  APIGatewayProxyEvent,
  Context,
  Handler,
} from 'aws-lambda';
import { AppModule } from './app.module';

let cachedHandler: Handler;

async function bootstrapServer(): Promise<Handler> {
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  app.enableCors({
    origin: (req, callback) => callback(null, true),
  });
  app.use(helmet());

  await app.init();

  return serverlessExpress({ app: expressApp });
}

export const handler: Handler = async (
  event: APIGatewayProxyEvent,
  context: Context,
  callback,
) => {
  // Reuse the bootstrapped server across warm invocations.
  cachedHandler = cachedHandler ?? (await bootstrapServer());
  return cachedHandler(event, context, callback);
};
