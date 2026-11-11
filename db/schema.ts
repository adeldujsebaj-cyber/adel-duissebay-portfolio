import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const siteProfile = sqliteTable('site_profile', {
  id: text('id').primaryKey(),
  data: text('data').notNull(),
  ownerId: text('owner_id').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const portfolioRecord = sqliteTable('portfolio_record', {
  id: text('id').primaryKey(),
  data: text('data').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const portfolioDocument = sqliteTable('portfolio_document', {
  id: text('id').primaryKey(),
  recordId: text('record_id').notNull(),
  name: text('name').notNull(),
  storageKey: text('storage_key').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  createdAt: text('created_at').notNull(),
});

export const portfolioVideoUpload = sqliteTable('portfolio_video_upload', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id').notNull(),
  recordId: text('record_id').notNull(),
  name: text('name').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  storageKey: text('storage_key').notNull(),
  uploadId: text('upload_id').notNull(),
  partsJson: text('parts_json').notNull(),
  state: text('state').notNull().default('uploading'),
  createdAt: text('created_at').notNull(),
});
