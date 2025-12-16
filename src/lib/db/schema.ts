/**
 * Database schema for Neon PostgreSQL
 * Dependencies: drizzle-orm, @neondatabase/serverless
 * Purpose: Store email captures and scan metadata
 */
import { pgTable, text, timestamp, integer, uuid, jsonb, boolean } from 'drizzle-orm/pg-core';

export const emailCaptures = pgTable('email_captures', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  jobId: uuid('job_id').notNull(),
  accessToken: uuid('access_token').notNull().unique(),
  
  // Lead gen fields
  name: text('name'),
  phone: text('phone'),
  company: text('company'), // Website/company name
  marketingOptIn: boolean('marketing_opt_in').default(false).notNull(),
  productOptIn: boolean('product_opt_in').default(false).notNull(),
  
  // App/scan details
  scannedUrl: text('scanned_url').notNull(),
  issuesFound: integer('issues_found').notNull().default(0),
  criticalCount: integer('critical_count').notNull().default(0),
  securityScore: integer('security_score'),
  
  // Metadata
  techStack: jsonb('tech_stack').$type<{
    framework?: string;
    hosting?: string;
    platform?: string;
  }>(),
  
  // Timestamps
  createdAt: timestamp('created_at').notNull().defaultNow(),
  emailSentAt: timestamp('email_sent_at'),
  accessedAt: timestamp('accessed_at'),
  
  // Flags
  emailDelivered: boolean('email_delivered').default(false),
  reportAccessed: boolean('report_accessed').default(false),
});

export const scanMetrics = pgTable('scan_metrics', {
  id: uuid('id').primaryKey().defaultRandom(),
  jobId: uuid('job_id').notNull().unique(),
  
  // Scan details
  url: text('url').notNull(),
  status: text('status').notNull(), // pending, completed, failed
  
  // Results
  securityScore: integer('security_score'),
  totalIssues: integer('total_issues').default(0),
  criticalIssues: integer('critical_issues').default(0),
  highIssues: integer('high_issues').default(0),
  mediumIssues: integer('medium_issues').default(0),
  lowIssues: integer('low_issues').default(0),
  
  // Tech details
  techStack: jsonb('tech_stack'),
  
  // Timing
  scanDuration: integer('scan_duration'), // milliseconds
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});

export type EmailCapture = typeof emailCaptures.$inferSelect;
export type NewEmailCapture = typeof emailCaptures.$inferInsert;
export type ScanMetric = typeof scanMetrics.$inferSelect;
export type NewScanMetric = typeof scanMetrics.$inferInsert;
