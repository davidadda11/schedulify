import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '$db/index';
import * as schema from '$db/schema';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
  provider: 'pg',
  schema: schema,
}),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },

  socialProviders: {
    google: {
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    },
  },

  session: {
    expiresIn:           60 * 60 * 24 * 7,
    updateAge:           60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge:  5 * 60,
    }
  },

  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? 'http://localhost:5173'
  ],

  advanced: {
    crossSubDomainCookies: { enabled: false },
    defaultCookieAttributes: {
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    }
  },

  pages: {
    signIn: '/login',
    signUp: '/register',
  }
});

export type Session = typeof auth.$Infer.Session;
export type User    = typeof auth.$Infer.Session.user;
