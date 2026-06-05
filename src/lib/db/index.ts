// src/lib/db/index.ts
import { DATABASE_URL } from '$env/static/private';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!DATABASE_URL) {
  throw new Error('❌ DATABASE_URL environment variable is required');
}

// Connection pool — reused across requests
const client = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
});

// Folosim import.meta.env.DEV (metoda nativă Vite) în loc de process.env.NODE_ENV
export const db = drizzle(client, { 
  schema, 
  logger: import.meta.env.DEV 
});

export type DB = typeof db;