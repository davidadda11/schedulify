// src/lib/db/schema.ts
// Drizzle ORM — PostgreSQL Schema

import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uuid,
  varchar,
  real,
} from 'drizzle-orm/pg-core';

// ── Better Auth required tables ──────────────────────────────
export const users = pgTable('user', {
  id:            text('id').primaryKey(),
  name:          text('name').notNull(),
  email:         text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image:         text('image'),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
  updatedAt:     timestamp('updated_at').notNull().defaultNow(),
  role:          text('role').notNull().default('user'),   // 'user' | 'admin'
  banned:        boolean('banned').notNull().default(false),
  edu24Username: text('edu24_username'),
  edu24Password: text('edu24_password'),
  gradeLevel:    integer('grade_level'),
  school:        text('school'),
});

export const sessions = pgTable('session', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token:     text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const accounts = pgTable('account', {
  id:                    text('id').primaryKey(),
  userId:                text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId:             text('account_id').notNull(),
  providerId:            text('provider_id').notNull(),
  accessToken:           text('access_token'),
  refreshToken:          text('refresh_token'),
  accessTokenExpiresAt:  timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope:                 text('scope'),
  password:              text('password'),
  createdAt:             timestamp('created_at').notNull().defaultNow(),
  updatedAt:             timestamp('updated_at').notNull().defaultNow(),
});

export const verifications = pgTable('verification', {
  id:         text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value:      text('value').notNull(),
  expiresAt:  timestamp('expires_at').notNull(),
  createdAt:  timestamp('created_at').defaultNow(),
  updatedAt:  timestamp('updated_at').defaultNow(),
});

// ── Application Tables ────────────────────────────────────────
export const subjects = pgTable('subjects', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:        varchar('name', { length: 100 }).notNull(),
  colorHex:    varchar('color_hex', { length: 7 }).notNull().default('#6366f1'),
  icon:        text('icon').default('📚'),
  hoursPerWeek: real('hours_per_week').default(2),
  priority:    integer('priority').default(1),     // 1 low → 5 high
  edu24Id:     text('edu24_id'),                   // mapping to 24edu subject
  createdAt:   timestamp('created_at').notNull().defaultNow(),
});

export const studySessions = pgTable('study_sessions', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subjectId:   uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  startedAt:   timestamp('started_at').notNull(),
  endedAt:     timestamp('ended_at'),
  durationMin: integer('duration_min'),
  technique:   text('technique').default('pomodoro'), // pomodoro | free | spaced
  notes:       text('notes'),
  completed:   boolean('completed').default(false),
});

export const tasks = pgTable('tasks', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subjectId:   uuid('subject_id').references(() => subjects.id, { onDelete: 'set null' }),
  title:       text('title').notNull(),
  description: text('description'),
  dueDate:     timestamp('due_date'),
  completed:   boolean('completed').default(false),
  priority:    integer('priority').default(2),
  type:        text('type').default('homework'),   // homework | test | project | revision
  ocrText:     text('ocr_text'),                   // extracted via Tesseract
  aiAnalysis:  jsonb('ai_analysis'),               // LLM feedback JSON
  createdAt:   timestamp('created_at').notNull().defaultNow(),
});

export const scheduleBlocks = pgTable('schedule_blocks', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  subjectId:   uuid('subject_id').references(() => subjects.id),
  dayOfWeek:   integer('day_of_week').notNull(),   // 0=Mon … 6=Sun
  startHour:   real('start_hour').notNull(),        // 14.5 = 14:30
  endHour:     real('end_hour').notNull(),
  type:        text('type').default('school'),      // school | study | activity
  label:       text('label'),
  source:      text('source').default('manual'),    // manual | edu24 | ai
});

// ── Type Exports ──────────────────────────────────────────────
export type User          = typeof users.$inferSelect;
export type Subject       = typeof subjects.$inferSelect;
export type StudySession  = typeof studySessions.$inferSelect;
export type Task          = typeof tasks.$inferSelect;
export type ScheduleBlock = typeof scheduleBlocks.$inferSelect;