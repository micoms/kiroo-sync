import {
    pgTable,
    uuid,
    text,
    timestamp,
    boolean,
    integer,
    real,
    jsonb,
    bigint,
    index,
    primaryKey,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// USERS & AUTHENTICATION
// ============================================================================

export const users = pgTable("users", {
    id: text("id").primaryKey(),
    email: text("email").unique().notNull(),
    name: text("name"),
    emailVerified: boolean("email_verified").default(false),
    image: text("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    token: text("token").unique().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .references(() => users.id, { onDelete: "cascade" })
        .notNull(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const verifications = pgTable("verifications", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// API Keys for mobile client authentication
export const apiKeys = pgTable(
    "api_keys",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: text("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        keyHash: text("key_hash").unique().notNull(),
        name: text("name").notNull(),
        deviceName: text("device_name"),
        lastUsedAt: timestamp("last_used_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [index("api_keys_user_idx").on(table.userId)]
);

// ============================================================================
// MANGA LIBRARY (mirrors BackupManga)
// ============================================================================

export const manga = pgTable(
    "manga",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: text("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        // Source identification
        source: bigint("source", { mode: "number" }).notNull(),
        url: text("url").notNull(),
        // Manga info
        title: text("title").notNull(),
        artist: text("artist"),
        author: text("author"),
        description: text("description"),
        genres: text("genres").array(),
        status: integer("status").default(0),
        thumbnailUrl: text("thumbnail_url"),
        // User preferences
        favorite: boolean("favorite").default(true),
        dateAdded: timestamp("date_added").defaultNow(),
        viewerFlags: integer("viewer_flags").default(-1),
        chapterFlags: integer("chapter_flags").default(0),
        updateStrategy: text("update_strategy").default("ALWAYS_UPDATE"),
        // Custom info (user overrides)
        customTitle: text("custom_title"),
        customArtist: text("custom_artist"),
        customAuthor: text("custom_author"),
        customDescription: text("custom_description"),
        customGenres: text("custom_genres").array(),
        customStatus: integer("custom_status").default(0),
        // Sync metadata
        lastModifiedAt: timestamp("last_modified_at").defaultNow().notNull(),
        version: integer("version").default(1).notNull(),
    },
    (table) => [
        index("manga_user_idx").on(table.userId),
        index("manga_source_url_idx").on(table.source, table.url),
    ]
);

// ============================================================================
// CHAPTERS (mirrors BackupChapter)
// ============================================================================

export const chapters = pgTable(
    "chapters",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        mangaId: uuid("manga_id")
            .references(() => manga.id, { onDelete: "cascade" })
            .notNull(),
        // Chapter identification
        url: text("url").notNull(),
        name: text("name").notNull(),
        scanlator: text("scanlator"),
        chapterNumber: real("chapter_number").default(0),
        sourceOrder: integer("source_order").default(0),
        // Reading progress
        read: boolean("read").default(false),
        bookmark: boolean("bookmark").default(false),
        lastPageRead: integer("last_page_read").default(0),
        pagesLeft: integer("pages_left").default(0),
        // Timestamps
        dateFetch: timestamp("date_fetch"),
        dateUpload: timestamp("date_upload"),
        // Sync metadata
        lastModifiedAt: timestamp("last_modified_at").defaultNow().notNull(),
        version: integer("version").default(1).notNull(),
    },
    (table) => [
        index("chapters_manga_idx").on(table.mangaId),
        index("chapters_url_idx").on(table.url),
    ]
);

// ============================================================================
// CATEGORIES (mirrors BackupCategory)
// ============================================================================

export const categories = pgTable(
    "categories",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: text("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        name: text("name").notNull(),
        order: integer("order").default(0),
        flags: integer("flags").default(0),
        mangaSort: text("manga_sort"),
    },
    (table) => [index("categories_user_idx").on(table.userId)]
);

// Junction table for manga-category relationships
export const mangaCategories = pgTable(
    "manga_categories",
    {
        mangaId: uuid("manga_id")
            .references(() => manga.id, { onDelete: "cascade" })
            .notNull(),
        categoryId: uuid("category_id")
            .references(() => categories.id, { onDelete: "cascade" })
            .notNull(),
    },
    (table) => [primaryKey({ columns: [table.mangaId, table.categoryId] })]
);

// ============================================================================
// TRACKING (mirrors BackupTracking)
// ============================================================================

export const tracking = pgTable(
    "tracking",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        mangaId: uuid("manga_id")
            .references(() => manga.id, { onDelete: "cascade" })
            .notNull(),
        // Tracker service info
        syncId: integer("sync_id").notNull(),
        mediaId: bigint("media_id", { mode: "number" }).notNull(),
        libraryId: bigint("library_id", { mode: "number" }),
        // Tracking data
        title: text("title"),
        trackingUrl: text("tracking_url"),
        lastChapterRead: real("last_chapter_read").default(0),
        totalChapters: integer("total_chapters").default(0),
        score: real("score").default(0),
        status: integer("status").default(0),
        startedReadingDate: timestamp("started_reading_date"),
        finishedReadingDate: timestamp("finished_reading_date"),
    },
    (table) => [index("tracking_manga_idx").on(table.mangaId)]
);

// ============================================================================
// HISTORY (mirrors BackupHistory)
// ============================================================================

export const history = pgTable(
    "history",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        mangaId: uuid("manga_id")
            .references(() => manga.id, { onDelete: "cascade" })
            .notNull(),
        chapterUrl: text("chapter_url").notNull(),
        lastRead: timestamp("last_read").notNull(),
        readDuration: bigint("read_duration", { mode: "number" }).default(0),
    },
    (table) => [
        index("history_manga_idx").on(table.mangaId),
        index("history_last_read_idx").on(table.lastRead),
    ]
);

// ============================================================================
// PREFERENCES
// ============================================================================

export const preferences = pgTable(
    "preferences",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: text("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        key: text("key").notNull(),
        value: jsonb("value"),
        type: text("type").default("string"),
    },
    (table) => [index("preferences_user_key_idx").on(table.userId, table.key)]
);

export const sourcePreferences = pgTable(
    "source_preferences",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: text("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        sourceId: bigint("source_id", { mode: "number" }).notNull(),
        preferences: jsonb("preferences"),
    },
    (table) => [
        index("source_prefs_user_source_idx").on(table.userId, table.sourceId),
    ]
);

// ============================================================================
// BACKUPS & SYNC
// ============================================================================

export const backups = pgTable(
    "backups",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: text("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        name: text("name").notNull(),
        description: text("description"),
        data: jsonb("data").notNull(),
        mangaCount: integer("manga_count").default(0),
        chapterCount: integer("chapter_count").default(0),
        sizeBytes: integer("size_bytes").default(0),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [index("backups_user_idx").on(table.userId)]
);

export const syncHistory = pgTable(
    "sync_history",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: text("user_id")
            .references(() => users.id, { onDelete: "cascade" })
            .notNull(),
        deviceName: text("device_name"),
        syncType: text("sync_type").notNull(), // "push" | "pull" | "full"
        mangaSynced: integer("manga_synced").default(0),
        chaptersSynced: integer("chapters_synced").default(0),
        status: text("status").notNull(), // "success" | "partial" | "failed"
        errorMessage: text("error_message"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("sync_history_user_idx").on(table.userId),
        index("sync_history_created_idx").on(table.createdAt),
    ]
);

// ============================================================================
// RELATIONS
// ============================================================================

export const usersRelations = relations(users, ({ many }) => ({
    sessions: many(sessions),
    accounts: many(accounts),
    apiKeys: many(apiKeys),
    manga: many(manga),
    categories: many(categories),
    preferences: many(preferences),
    sourcePreferences: many(sourcePreferences),
    backups: many(backups),
    syncHistory: many(syncHistory),
}));

export const mangaRelations = relations(manga, ({ one, many }) => ({
    user: one(users, { fields: [manga.userId], references: [users.id] }),
    chapters: many(chapters),
    tracking: many(tracking),
    history: many(history),
    mangaCategories: many(mangaCategories),
}));

export const chaptersRelations = relations(chapters, ({ one }) => ({
    manga: one(manga, { fields: [chapters.mangaId], references: [manga.id] }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    user: one(users, { fields: [categories.userId], references: [users.id] }),
    mangaCategories: many(mangaCategories),
}));

export const mangaCategoriesRelations = relations(
    mangaCategories,
    ({ one }) => ({
        manga: one(manga, {
            fields: [mangaCategories.mangaId],
            references: [manga.id],
        }),
        category: one(categories, {
            fields: [mangaCategories.categoryId],
            references: [categories.id],
        }),
    })
);

export const trackingRelations = relations(tracking, ({ one }) => ({
    manga: one(manga, { fields: [tracking.mangaId], references: [manga.id] }),
}));

export const historyRelations = relations(history, ({ one }) => ({
    manga: one(manga, { fields: [history.mangaId], references: [manga.id] }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
    user: one(users, { fields: [apiKeys.userId], references: [users.id] }),
}));

