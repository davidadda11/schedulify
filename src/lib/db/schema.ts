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
  index,
} from 'drizzle-orm/pg-core';

// ── Better Auth required tables ──────────────────────────────
export const user = pgTable('user', {
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

export const session = pgTable('session', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  token:     text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const account = pgTable('account', {
  id:                    text('id').primaryKey(),
  userId:                text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
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

export const verification = pgTable('verification', {
  id:         text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value:      text('value').notNull(),
  expiresAt:  timestamp('expires_at').notNull(),
  createdAt:  timestamp('created_at').defaultNow(),
  updatedAt:  timestamp('updated_at').defaultNow(),
});

// ── Application Tables ────────────────────────────────────────
export const subject = pgTable('subjects', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  name:        varchar('name', { length: 100 }).notNull(),
  colorHex:    varchar('color_hex', { length: 7 }).notNull().default('#6366f1'),
  icon:        text('icon').default('📚'),
  hoursPerWeek: real('hours_per_week').default(2),
  priority:    integer('priority').default(1),     // 1 low → 5 high
  edu24Id:     text('edu24_id'),                   // mapping to 24edu subject
  createdAt:   timestamp('created_at').notNull().defaultNow(),
});

export const studySession = pgTable('study_sessions', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  subjectId:   uuid('subject_id').references(() => subject.id, { onDelete: 'set null' }),
  startedAt:   timestamp('started_at').notNull(),
  endedAt:     timestamp('ended_at'),
  durationMin: integer('duration_min'),
  technique:   text('technique').default('pomodoro'), // pomodoro | free | spaced
  notes:       text('notes'),
  completed:   boolean('completed').default(false),
});

export const task = pgTable('tasks', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  subjectId:   uuid('subject_id').references(() => subject.id, { onDelete: 'set null' }),
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
  userId:      text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  subjectId:   uuid('subject_id').references(() => subject.id),
  dayOfWeek:   integer('day_of_week').notNull(),   // 0=Mon … 6=Sun
  startHour:   real('start_hour').notNull(),        // 14.5 = 14:30
  endHour:     real('end_hour').notNull(),
  type:        text('type').default('school'),      // school | study | activity
  label:       text('label'),
  source:      text('source').default('manual'),    // manual | edu24 | ai
});

export const studyPlanItem = pgTable('study_plan_items', {
  id:         uuid('id').primaryKey().defaultRandom(),
  userId:     text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  date:       text('date').notNull(),         // ISO "2026-06-13"
  zi:         text('zi').notNull(),           // "Luni", "Marți", etc.
  ora:        text('ora').notNull(),          // "16:00"
  activitate: text('activitate').notNull(),
  durata:     text('durata').notNull(),
  tip:        text('tip').notNull(),          // 'studiu' | 'recapitulare' | 'pauza'
  bifat:      boolean('bifat').notNull().default(false),
  createdAt:  timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userDateIdx: index('study_plan_items_user_id_date_idx').on(table.userId, table.date),
}));
 
 
// ── Type Exports ──────────────────────────────────────────────
export type User          = typeof user.$inferSelect;
export type Subject       = typeof subject.$inferSelect;
export type StudySession  = typeof studySession.$inferSelect;
export type Task          = typeof task.$inferSelect;
export type ScheduleBlock = typeof scheduleBlocks.$inferSelect;
export type StudyPlanItem = typeof studyPlanItem.$inferSelect;
