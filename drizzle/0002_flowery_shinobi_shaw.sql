CREATE TABLE `portfolio_video_upload` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`record_id` text NOT NULL,
	`name` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`storage_key` text NOT NULL,
	`upload_id` text NOT NULL,
	`parts_json` text NOT NULL,
	`created_at` text NOT NULL
);
