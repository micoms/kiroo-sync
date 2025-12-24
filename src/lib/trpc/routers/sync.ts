import { z } from "zod";
import { router, protectedProcedure, apiKeyProcedure } from "../init";
import { manga, chapters, categories, tracking, history, syncHistory } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// Schema for sync data from mobile clients
const syncDataSchema = z.object({
    manga: z.array(z.object({
        source: z.number(),
        url: z.string(),
        title: z.string(),
        artist: z.string().nullable().optional(),
        author: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        genres: z.array(z.string()).optional(),
        status: z.number().optional(),
        thumbnailUrl: z.string().nullable().optional(),
        favorite: z.boolean().optional(),
        dateAdded: z.number().optional(),
        viewerFlags: z.number().optional(),
        chapterFlags: z.number().optional(),
        updateStrategy: z.string().optional(),
        chapters: z.array(z.object({
            url: z.string(),
            name: z.string(),
            scanlator: z.string().nullable().optional(),
            chapterNumber: z.number().optional(),
            read: z.boolean().optional(),
            bookmark: z.boolean().optional(),
            lastPageRead: z.number().optional(),
            pagesLeft: z.number().optional(),
            dateFetch: z.number().optional(),
            dateUpload: z.number().optional(),
        })).optional(),
        tracking: z.array(z.object({
            syncId: z.number(),
            mediaId: z.number(),
            libraryId: z.number().optional(),
            title: z.string().optional(),
            trackingUrl: z.string().optional(),
            lastChapterRead: z.number().optional(),
            totalChapters: z.number().optional(),
            score: z.number().optional(),
            status: z.number().optional(),
        })).optional(),
        history: z.array(z.object({
            chapterUrl: z.string(),
            lastRead: z.number(),
            readDuration: z.number().optional(),
        })).optional(),
        categories: z.array(z.number()).optional(),
        customTitle: z.string().nullable().optional(),
        customArtist: z.string().nullable().optional(),
        customAuthor: z.string().nullable().optional(),
        customDescription: z.string().nullable().optional(),
        customGenres: z.array(z.string()).nullable().optional(),
        customStatus: z.number().optional(),
    })),
    categories: z.array(z.object({
        name: z.string(),
        order: z.number().optional(),
        flags: z.number().optional(),
        mangaSort: z.string().nullable().optional(),
    })).optional(),
    deviceName: z.string().optional(),
});

export const syncRouter = router({
    // Push sync data from mobile client
    push: apiKeyProcedure
        .input(syncDataSchema)
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.userId;
            let mangaSynced = 0;
            let chaptersSynced = 0;

            try {
                // Process each manga
                for (const m of input.manga) {
                    // Check if manga already exists
                    const existing = await ctx.db.query.manga.findFirst({
                        where: and(
                            eq(manga.userId, userId),
                            eq(manga.source, m.source),
                            eq(manga.url, m.url)
                        ),
                    });

                    let mangaId: string;

                    if (existing) {
                        // Update existing manga
                        await ctx.db.update(manga)
                            .set({
                                title: m.title,
                                artist: m.artist,
                                author: m.author,
                                description: m.description,
                                genres: m.genres,
                                status: m.status ?? 0,
                                thumbnailUrl: m.thumbnailUrl,
                                favorite: m.favorite ?? true,
                                viewerFlags: m.viewerFlags ?? -1,
                                chapterFlags: m.chapterFlags ?? 0,
                                updateStrategy: m.updateStrategy ?? "ALWAYS_UPDATE",
                                customTitle: m.customTitle,
                                customArtist: m.customArtist,
                                customAuthor: m.customAuthor,
                                customDescription: m.customDescription,
                                customGenres: m.customGenres,
                                customStatus: m.customStatus ?? 0,
                                lastModifiedAt: new Date(),
                                version: existing.version + 1,
                            })
                            .where(eq(manga.id, existing.id));
                        mangaId = existing.id;
                    } else {
                        // Insert new manga
                        const [inserted] = await ctx.db.insert(manga)
                            .values({
                                userId,
                                source: m.source,
                                url: m.url,
                                title: m.title,
                                artist: m.artist,
                                author: m.author,
                                description: m.description,
                                genres: m.genres,
                                status: m.status ?? 0,
                                thumbnailUrl: m.thumbnailUrl,
                                favorite: m.favorite ?? true,
                                dateAdded: m.dateAdded ? new Date(m.dateAdded) : new Date(),
                                viewerFlags: m.viewerFlags ?? -1,
                                chapterFlags: m.chapterFlags ?? 0,
                                updateStrategy: m.updateStrategy ?? "ALWAYS_UPDATE",
                                customTitle: m.customTitle,
                                customArtist: m.customArtist,
                                customAuthor: m.customAuthor,
                                customDescription: m.customDescription,
                                customGenres: m.customGenres,
                                customStatus: m.customStatus ?? 0,
                            })
                            .returning();
                        mangaId = inserted.id;
                    }
                    mangaSynced++;

                    // Process chapters
                    if (m.chapters) {
                        for (const ch of m.chapters) {
                            const existingChapter = await ctx.db.query.chapters.findFirst({
                                where: and(
                                    eq(chapters.mangaId, mangaId),
                                    eq(chapters.url, ch.url)
                                ),
                            });

                            if (existingChapter) {
                                await ctx.db.update(chapters)
                                    .set({
                                        name: ch.name,
                                        scanlator: ch.scanlator,
                                        chapterNumber: ch.chapterNumber ?? 0,
                                        read: ch.read ?? false,
                                        bookmark: ch.bookmark ?? false,
                                        lastPageRead: ch.lastPageRead ?? 0,
                                        pagesLeft: ch.pagesLeft ?? 0,
                                        lastModifiedAt: new Date(),
                                        version: existingChapter.version + 1,
                                    })
                                    .where(eq(chapters.id, existingChapter.id));
                            } else {
                                await ctx.db.insert(chapters).values({
                                    mangaId,
                                    url: ch.url,
                                    name: ch.name,
                                    scanlator: ch.scanlator,
                                    chapterNumber: ch.chapterNumber ?? 0,
                                    read: ch.read ?? false,
                                    bookmark: ch.bookmark ?? false,
                                    lastPageRead: ch.lastPageRead ?? 0,
                                    pagesLeft: ch.pagesLeft ?? 0,
                                    dateFetch: ch.dateFetch ? new Date(ch.dateFetch) : null,
                                    dateUpload: ch.dateUpload ? new Date(ch.dateUpload) : null,
                                });
                            }
                            chaptersSynced++;
                        }
                    }

                    // Process tracking
                    if (m.tracking) {
                        for (const t of m.tracking) {
                            const existingTracking = await ctx.db.query.tracking.findFirst({
                                where: and(
                                    eq(tracking.mangaId, mangaId),
                                    eq(tracking.syncId, t.syncId)
                                ),
                            });

                            if (existingTracking) {
                                await ctx.db.update(tracking)
                                    .set({
                                        mediaId: t.mediaId,
                                        libraryId: t.libraryId,
                                        title: t.title,
                                        trackingUrl: t.trackingUrl,
                                        lastChapterRead: t.lastChapterRead ?? 0,
                                        totalChapters: t.totalChapters ?? 0,
                                        score: t.score ?? 0,
                                        status: t.status ?? 0,
                                    })
                                    .where(eq(tracking.id, existingTracking.id));
                            } else {
                                await ctx.db.insert(tracking).values({
                                    mangaId,
                                    syncId: t.syncId,
                                    mediaId: t.mediaId,
                                    libraryId: t.libraryId,
                                    title: t.title,
                                    trackingUrl: t.trackingUrl,
                                    lastChapterRead: t.lastChapterRead ?? 0,
                                    totalChapters: t.totalChapters ?? 0,
                                    score: t.score ?? 0,
                                    status: t.status ?? 0,
                                });
                            }
                        }
                    }

                    // Process history
                    if (m.history) {
                        for (const h of m.history) {
                            await ctx.db.insert(history)
                                .values({
                                    mangaId,
                                    chapterUrl: h.chapterUrl,
                                    lastRead: new Date(h.lastRead),
                                    readDuration: h.readDuration ?? 0,
                                })
                                .onConflictDoUpdate({
                                    target: [history.mangaId, history.chapterUrl],
                                    set: {
                                        lastRead: new Date(h.lastRead),
                                        readDuration: h.readDuration ?? 0,
                                    },
                                });
                        }
                    }
                }

                // Log sync history
                await ctx.db.insert(syncHistory).values({
                    userId,
                    deviceName: input.deviceName ?? ctx.apiKey.deviceName ?? "Unknown",
                    syncType: "push",
                    mangaSynced,
                    chaptersSynced,
                    status: "success",
                });

                return { success: true, mangaSynced, chaptersSynced };
            } catch (error) {
                // Log failed sync
                await ctx.db.insert(syncHistory).values({
                    userId,
                    deviceName: input.deviceName ?? ctx.apiKey.deviceName ?? "Unknown",
                    syncType: "push",
                    mangaSynced,
                    chaptersSynced,
                    status: "failed",
                    errorMessage: error instanceof Error ? error.message : "Unknown error",
                });
                throw error;
            }
        }),

    // Pull sync data to mobile client
    pull: apiKeyProcedure.query(async ({ ctx }) => {
        const userId = ctx.userId;

        const mangaList = await ctx.db.query.manga.findMany({
            where: eq(manga.userId, userId),
            with: {
                chapters: true,
                tracking: true,
                history: true,
                mangaCategories: {
                    with: { category: true },
                },
            },
        });

        const categoriesList = await ctx.db.query.categories.findMany({
            where: eq(categories.userId, userId),
        });

        // Log sync history
        await ctx.db.insert(syncHistory).values({
            userId,
            deviceName: ctx.apiKey.deviceName ?? "Unknown",
            syncType: "pull",
            mangaSynced: mangaList.length,
            chaptersSynced: mangaList.reduce((sum, m) => sum + m.chapters.length, 0),
            status: "success",
        });

        return {
            manga: mangaList.map((m) => ({
                source: m.source,
                url: m.url,
                title: m.title,
                artist: m.artist,
                author: m.author,
                description: m.description,
                genres: m.genres,
                status: m.status,
                thumbnailUrl: m.thumbnailUrl,
                favorite: m.favorite,
                dateAdded: m.dateAdded?.getTime(),
                viewerFlags: m.viewerFlags,
                chapterFlags: m.chapterFlags,
                updateStrategy: m.updateStrategy,
                customTitle: m.customTitle,
                customArtist: m.customArtist,
                customAuthor: m.customAuthor,
                customDescription: m.customDescription,
                customGenres: m.customGenres,
                customStatus: m.customStatus,
                chapters: m.chapters.map((ch) => ({
                    url: ch.url,
                    name: ch.name,
                    scanlator: ch.scanlator,
                    chapterNumber: ch.chapterNumber,
                    read: ch.read,
                    bookmark: ch.bookmark,
                    lastPageRead: ch.lastPageRead,
                    pagesLeft: ch.pagesLeft,
                    dateFetch: ch.dateFetch?.getTime(),
                    dateUpload: ch.dateUpload?.getTime(),
                })),
                tracking: m.tracking.map((t) => ({
                    syncId: t.syncId,
                    mediaId: t.mediaId,
                    libraryId: t.libraryId,
                    title: t.title,
                    trackingUrl: t.trackingUrl,
                    lastChapterRead: t.lastChapterRead,
                    totalChapters: t.totalChapters,
                    score: t.score,
                    status: t.status,
                })),
                history: m.history.map((h) => ({
                    chapterUrl: h.chapterUrl,
                    lastRead: h.lastRead.getTime(),
                    readDuration: h.readDuration,
                })),
                categories: m.mangaCategories.map((mc) => mc.category.order),
            })),
            categories: categoriesList.map((c) => ({
                name: c.name,
                order: c.order,
                flags: c.flags,
                mangaSort: c.mangaSort,
            })),
        };
    }),

    // Get sync status (for dashboard)
    status: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        const lastSync = await ctx.db.query.syncHistory.findFirst({
            where: eq(syncHistory.userId, userId),
            orderBy: desc(syncHistory.createdAt),
        });

        const mangaCount = await ctx.db
            .select()
            .from(manga)
            .where(eq(manga.userId, userId));

        return {
            lastSync: lastSync?.createdAt,
            mangaCount: mangaCount.length,
            status: lastSync?.status ?? "never",
        };
    }),

    // Get sync history (for dashboard)
    history: protectedProcedure
        .input(z.object({
            limit: z.number().min(1).max(100).default(20),
            offset: z.number().min(0).default(0),
        }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const historyList = await ctx.db.query.syncHistory.findMany({
                where: eq(syncHistory.userId, userId),
                orderBy: desc(syncHistory.createdAt),
                limit: input.limit,
                offset: input.offset,
            });

            return historyList;
        }),
});
