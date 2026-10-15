import { neon } from '@neondatabase/serverless';

let client;
export const sql = (...args) => {
  if (!client) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    client = neon(url);
  }
  return client(...args);
};

export const err = (m, s = 400) => Response.json({ error: m }, { status: s });
export const FINE_PER_DAY = 1;