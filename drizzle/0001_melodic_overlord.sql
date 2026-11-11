CREATE TABLE `portfolio_document` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`name` text NOT NULL,
	`storage_key` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portfolio_record` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`updated_at` text NOT NULL
);
