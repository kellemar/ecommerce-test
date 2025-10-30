import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { UnderscoreNamingStrategy } from '@mikro-orm/core';

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default defineConfig({
  extensions: [Migrator],
  namingStrategy: UnderscoreNamingStrategy,
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: toNumber(process.env.DB_PORT, 5432),
  user: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  dbName: process.env.DB_NAME ?? 'mandai',
  debug: process.env.NODE_ENV !== 'production',
  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],
  migrations: {
    path: './migrations',
    pathTs: './migrations',
    disableForeignKeys: false,
    snapshot: true,
  },
  seeder: {
    path: './seeders',
    pathTs: './seeders',
    defaultSeeder: 'DatabaseSeeder',
  },
});
