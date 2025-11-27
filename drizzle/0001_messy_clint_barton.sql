ALTER TABLE "transactions" DROP CONSTRAINT "transactions_polar_event_id_unique";--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "order_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_unique" UNIQUE("order_id");