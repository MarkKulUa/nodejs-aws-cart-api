import { build } from 'esbuild';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Step 1: compile with tsc (via nest build). NestJS dependency injection relies
// on `emitDecoratorMetadata`, which only tsc emits — esbuild alone strips it.
// The compiled JS in dist/ already contains the __metadata() calls.
console.log('> nest build (tsc, emits decorator metadata)');
execSync('npm run build', { cwd: root, stdio: 'inherit' });

// Step 2: bundle the *compiled JS* with esbuild. Bundling JS keeps the metadata
// intact (esbuild only re-transpiles TS, not already-emitted JS).
console.log('> esbuild bundle dist/lambda.js');
await build({
  entryPoints: [join(root, 'dist/lambda.js')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: join(root, 'dist-lambda/index.js'),
  sourcemap: true,
  external: [
    '@aws-sdk/*',
    // NestJS optional packages (not used by this app)
    '@nestjs/microservices',
    '@nestjs/microservices/microservices-module',
    '@nestjs/websockets',
    '@nestjs/websockets/socket-module',
    '@nestjs/platform-socket.io',
    '@fastify/static',
    'cache-manager',
    'class-transformer',
    'class-transformer/storage',
    'class-validator',
    // TypeORM optional drivers
    'pg-native',
    'pg-query-stream',
    'mysql',
    'mysql2',
    'oracledb',
    'sqlite3',
    'better-sqlite3',
    'mssql',
    'mongodb',
    'redis',
    'ioredis',
    'sql.js',
    'hdb-pool',
    '@sap/hana-client',
    '@sap/hana-client/extension/Stream',
    'react-native-sqlite-storage',
    'typeorm-aurora-data-api-driver',
    '@google-cloud/spanner',
    'spanner',
    'pg-cloudflare',
  ],
  logLevel: 'info',
});

console.log('Lambda bundle written to dist-lambda/index.js');
