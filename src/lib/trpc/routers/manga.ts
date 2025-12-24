import { z } from "zod";
import { router, protectedProcedure, apiKeyProcedure } from "../init";
import { manga, chapters, categories, mangaCategories, tracking, history } from "@/lib/db/schema";
import { eq, desc, like, and, sql } from "drizzle-orm";

export const mangaRouter = router({
    // List manga with pagination and filters
    list: protectedProcedure
        .input(z.object({
            limit: z.number().min(1).max(100).default(20),
            offset: z.number().min(0).default(0),
            search: z.string().optional(),
            favorite: z.boolean().optional(),
            categoryId: z.string().uuid().optional(),
        }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            let whereClause = eq(manga.userId, userId);

            if (input.favorite !== undefined) {
                whereClause = and(whereClause, eq(manga.favorite, input.favorite))!;
            }

            const mangaList = await ctx.db.query.manga.findMany({
                where: whereClause,
                orderBy: desc(manga.lastModifiedAt),
                limit: input.limit,
                offset: input.offset,
                with: {
                    chapters: {
                        columns: { id: true, read: true },
                    },
                },
            });

            // Filter by search if provided
            let filtered = mangaList;
            if (input.search) {
                const searchLower = input.search.toLowerCase();
                filtered = mangaList.filter((m) =>
                    m.title.toLowerCase().includes(searchLower) ||
                    m.author?.toLowerCase().includes(searchLower) ||
                    m.artist?.toLowerCase().includes(searchLower)
                );
            }

            return filtered.map((m) => ({
                id: m.id,
                source: m.source,
                url: m.url,
                title: m.customTitle || m.title,
                artist: m.customArtist || m.artist,
                author: m.customAuthor || m.author,
                thumbnailUrl: m.thumbnailUrl,
                favorite: m.favorite,
                status: m.customStatus || m.status,
                totalChapters: m.chapters.length,
                readChapters: m.chapters.filter((ch) => ch.read).length,
                lastModifiedAt: m.lastModifiedAt,
            }));
        }),

    // Get single manga with all details
    get: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const mangaItem = await ctx.db.query.manga.findFirst({
                where: and(eq(manga.id, input.id), eq(manga.userId, userId)),
                with: {
                    chapters: {
                        orderBy: desc(chapters.chapterNumber),
                    },
                    tracking: true,
                    history: {
                        orderBy: desc(history.lastRead),
                        limit: 10,
                    },
                    mangaCategories: {
                        with: { category: true },
                    },
                },
            });

            if (!mangaItem) {
                return null;
            }

            return {
                ...mangaItem,
                title: mangaItem.customTitle || mangaItem.title,
                artist: mangaItem.customArtist || mangaItem.artist,
                author: mangaItem.customAuthor || mangaItem.author,
                description: mangaItem.customDescription || mangaItem.description,
                genres: mangaItem.customGenres || mangaItem.genres,
                status: mangaItem.customStatus || mangaItem.status,
                categories: mangaItem.mangaCategories.map((mc) => mc.category),
            };
        }),

    // Get reading statistics
    stats: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        const mangaList = await ctx.db.query.manga.findMany({
            where: eq(manga.userId, userId),
            with: {
                chapters: {
                    columns: { read: true },
                },
            },
        });

        const totalManga = mangaList.length;
        const favoriteManga = mangaList.filter((m) => m.favorite).length;
        const totalChapters = mangaList.reduce((sum, m) => sum + m.chapters.length, 0);
        const readChapters = mangaList.reduce(
            (sum, m) => sum + m.chapters.filter((ch) => ch.read).length,
            0
        );

        return {
            totalManga,
            favoriteManga,
            totalChapters,
            readChapters,
            completionRate: totalChapters > 0 ? (readChapters / totalChapters) * 100 : 0,
        };
    }),

    // Delete manga
    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            await ctx.db
                .delete(manga)
                .where(and(eq(manga.id, input.id), eq(manga.userId, userId)));

            return { success: true };
        }),
});
