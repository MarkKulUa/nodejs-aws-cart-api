#!/usr/bin/env node
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib/core';
import { CartServiceStack } from '../lib/cart_service-stack';

// Load DB credentials from .env (git-ignored). `parsed` contains only the keys
// declared in the file, so nothing from the local shell leaks into the lambda.
const { parsed } = dotenv.config({
  path: path.join(__dirname, '../../.env'),
});
const env = parsed ?? {};

const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_USERNAME', 'DB_PASSWORD', 'DB_NAME'];
const missing = requiredVars.filter((key) => !env[key]);
if (missing.length > 0) {
  throw new Error(
    `Missing required DB env vars in .env: ${missing.join(', ')}. ` +
      'See env.example.',
  );
}

const app = new cdk.App();
new CartServiceStack(app, 'CartServiceStack', {
  dbEnv: {
    DB_HOST: env.DB_HOST,
    DB_PORT: env.DB_PORT,
    DB_USERNAME: env.DB_USERNAME,
    DB_PASSWORD: env.DB_PASSWORD,
    DB_NAME: env.DB_NAME,
    DB_SSL: env.DB_SSL ?? 'true',
  },
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
