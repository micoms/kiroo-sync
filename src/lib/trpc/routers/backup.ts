import { z } from "zod";
import { router, protectedProcedure } from "../init";
import { backups, manga, chapters, categories, tracking, history } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const backupRouter = router({
    // List all backups
    list: protectedProcedure
        .input(z.object({
            limit: z.number().min(1).max(50).default(10),
            offset: z.number().min(0).default(0),
        }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const backupList = await ctx.db.query.backups.findMany({
                where: eq(backups.userId, userId),
                orderBy: desc(backups.createdAt),
                limit: input.limit,
                offset: input.offset,
                columns: {
                    id: true,
                    name: true,
                    description: true,
                    mangaCount: true,
                    chapterCount: true,
                    sizeBytes: true,
                    createdAt: true,
                },
            });

            return backupList;
        }),

    // Get single backup details
    get: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const backup = await ctx.db.query.backups.findFirst({
                where: eq(backups.id, input.id),
            });

            if (!backup || backup.userId !== userId) {
                return null;
            }

            return backup;
        }),

    // Create a new backup snapshot
    create: protectedProcedure
        .input(z.object({
            name: z.string().min(1).max(100),
            description: z.string().max(500).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            // Gather all user data
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

            // Build backup data
            const backupData = {
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
                    chapters: m.chapters,
                    tracking: m.tracking,
                    history: m.history,
                    categories: m.mangaCategories.map((mc) => mc.category.order),
                })),
                categories: categoriesList,
            };

            const dataString = JSON.stringify(backupData);
            const totalChapters = mangaList.reduce((sum, m) => sum + m.chapters.length, 0);

            const [created] = await ctx.db.insert(backups)
                .values({
                    userId,
                    name: input.name,
                    description: input.description,
                    data: backupData,
                    mangaCount: mangaList.length,
                    chapterCount: totalChapters,
                    sizeBytes: new TextEncoder().encode(dataString).length,
                })
                .returning();

            return {
                id: created.id,
                name: created.name,
                mangaCount: created.mangaCount,
                chapterCount: created.chapterCount,
                sizeBytes: created.sizeBytes,
                createdAt: created.createdAt,
            };
        }),

    // Delete a backup
    delete: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const backup = await ctx.db.query.backups.findFirst({
                where: eq(backups.id, input.id),
            });

            if (!backup || backup.userId !== userId) {
                throw new Error("Backup not found");
            }

            await ctx.db.delete(backups).where(eq(backups.id, input.id));

            return { success: true };
        }),

    // Download backup as JSON
    download: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id;

            const backup = await ctx.db.query.backups.findFirst({
                where: eq(backups.id, input.id),
            });

            if (!backup || backup.userId !== userId) {
                throw new Error("Backup not found");
            }

            return {
                filename: `kiroo-sync-backup-${backup.name}-${backup.createdAt.toISOString().split('T')[0]}.json`,
                data: backup.data,
            };
        }),
});
