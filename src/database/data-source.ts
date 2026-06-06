import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { getDataSourceOptions } from './data-source-options';

// Used by the TypeORM CLI (migration generation/run from a machine that can
// reach the DB). At runtime the Nest app builds its own options via the module.
dotenv.config();

export default new DataSource(getDataSourceOptions());
