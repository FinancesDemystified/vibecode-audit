ALTER TABLE "email_captures" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "email_captures" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "email_captures" ADD COLUMN "company" text;--> statement-breakpoint
ALTER TABLE "email_captures" ADD COLUMN "marketing_opt_in" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "email_captures" ADD COLUMN "product_opt_in" boolean DEFAULT false NOT NULL;