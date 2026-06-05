// src/lib/auth/auth.ts
// Better Auth — Server Configuration
// Docs: https://www.better-auth.com

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '$db/index';
import * as schema from '$db/schema';

export const auth = betterAuth({
  // ── Database ──────────────────────────────────────────────
  database: drizzleAdapter(db, {
    provider: 'pg',        // 'sqlite' for local dev with SQLite
    schema: {
      user:    schema.users,
      session: schema.sessions,
      account: schema.accounts,
    }
  }),

  // ── Email + Password ──────────────────────────────────────
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,   // set true in production
    minPasswordLength: 8,
  },

  // ── Social Providers (optional) ───────────────────────────
  socialProviders: {
    google: {
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },

  // ── Session ───────────────────────────────────────────────
  session: {
    expiresIn:           60 * 60 * 24 * 7,   // 7 days
    updateAge:           60 * 60 * 24,        // refresh every 24h
    cookieCache: {
      enabled: true,
      maxAge:  5 * 60,                        // 5-min client-side cache
    }
  },

  // ── Trusted Origins ───────────────────────────────────────
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? 'http://localhost:5173'
  ],

  // ── Advanced ──────────────────────────────────────────────
  advanced: {
    crossSubDomainCookies: { enabled: false },
    defaultCookieAttributes: {
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    }
  }
});

export type Session = typeof auth.$Infer.Session;
export type User    = typeof auth.$Infer.Session.user;