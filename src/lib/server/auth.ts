import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import * as schema from '$lib/db/schema';

export const auth = betterAuth({
  baseURL: env.ORIGIN,
  basePath: '/api/auth',
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  emailAndPassword: { enabled: true },
  user: {
    additionalFields: {
      role:   { type: 'string',  defaultValue: 'user'  },
      banned: { type: 'boolean', defaultValue: false    },
    }
  },
});