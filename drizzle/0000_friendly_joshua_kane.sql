CREATE TABLE "email_captures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"job_id" uuid NOT NULL,
	"access_token" uuid NOT NULL,
	"scanned_url" text NOT NULL,
	"issues_found" integer DEFAULT 0 NOT NULL,
	"critical_count" integer DEFAULT 0 NOT NULL,
	"security_score" integer,
	"tech_stack" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email_sent_at" timestamp,
	"accessed_at" timestamp,
	"email_delivered" boolean DEFAULT false,
	"report_accessed" boolean DEFAULT false,
	CONSTRAINT "email_captures_access_token_unique" UNIQUE("access_token")
);
--> statement-breakpoint
CREATE TABLE "scan_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"url" text NOT NULL,
	"status" text NOT NULL,
	"security_score" integer,
	"total_issues" integer DEFAULT 0,
	"critical_issues" integer DEFAULT 0,
	"high_issues" integer DEFAULT 0,
	"medium_issues" integer DEFAULT 0,
	"low_issues" integer DEFAULT 0,
	"tech_stack" jsonb,
	"scan_duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "scan_metrics_job_id_unique" UNIQUE("job_id")
);
