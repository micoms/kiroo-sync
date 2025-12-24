import { router, protectedProcedure } from "../init";
import { extensionRepos, savedSearches, feeds, categories, preferences, sourcePreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const dataRouter = router({
    // ============================================================================
    // Categories
    // ============================================================================
    categories: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.query.categories.findMany({
            where: eq(categories.userId, ctx.session.user.id),
            orderBy: (categories, { asc }) => [asc(categories.order)],
        });
    }),

    // ============================================================================
    // Extension Repos
    // ============================================================================
    extensionRepos: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.query.extensionRepos.findMany({
            where: eq(extensionRepos.userId, ctx.session.user.id),
        });
    }),

    deleteExtensionRepo: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(extensionRepos).where(eq(extensionRepos.id, input.id));
            return { success: true };
        }),

    // ============================================================================
    // Saved Searches
    // ============================================================================
    savedSearches: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.query.savedSearches.findMany({
            where: eq(savedSearches.userId, ctx.session.user.id),
        });
    }),

    deleteSavedSearch: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(savedSearches).where(eq(savedSearches.id, input.id));
            return { success: true };
        }),

    // ============================================================================
    // Feeds
    // ============================================================================
    feeds: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.query.feeds.findMany({
            where: eq(feeds.userId, ctx.session.user.id),
        });
    }),

    deleteFeed: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(feeds).where(eq(feeds.id, input.id));
            return { success: true };
        }),

    // ============================================================================
    // Preferences
    // ============================================================================
    preferences: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.query.preferences.findMany({
            where: eq(preferences.userId, ctx.session.user.id),
        });
    }),

    // ============================================================================
    // Source Preferences
    // ============================================================================
    sourcePreferences: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.query.sourcePreferences.findMany({
            where: eq(sourcePreferences.userId, ctx.session.user.id),
        });
    }),

    // ============================================================================
    // Stats
    // ============================================================================
    stats: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id;
        const [repos, searches, feedsList, cats, prefs, sourcePrefs] = await Promise.all([
            ctx.db.query.extensionRepos.findMany({ where: eq(extensionRepos.userId, userId) }),
            ctx.db.query.savedSearches.findMany({ where: eq(savedSearches.userId, userId) }),
            ctx.db.query.feeds.findMany({ where: eq(feeds.userId, userId) }),
            ctx.db.query.categories.findMany({ where: eq(categories.userId, userId) }),
            ctx.db.query.preferences.findMany({ where: eq(preferences.userId, userId) }),
            ctx.db.query.sourcePreferences.findMany({ where: eq(sourcePreferences.userId, userId) }),
        ]);

        return {
            extensionRepos: repos.length,
            savedSearches: searches.length,
            feeds: feedsList.length,
            categories: cats.length,
            preferences: prefs.length,
            sourcePreferences: sourcePrefs.length,
        };
    }),

    // ============================================================================
    // Reset All Data
    // ============================================================================
    resetAllData: protectedProcedure.mutation(async ({ ctx }) => {
        const userId = ctx.session.user.id;

        // Import additional tables needed for deletion
        const { manga, syncHistory, backups } = await import("@/lib/db/schema");

        // Delete manga first - foreign keys with cascade will handle related data
        await ctx.db.delete(manga).where(eq(manga.userId, userId));
        await ctx.db.delete(categories).where(eq(categories.userId, userId));
        await ctx.db.delete(extensionRepos).where(eq(extensionRepos.userId, userId));
        await ctx.db.delete(savedSearches).where(eq(savedSearches.userId, userId));
        await ctx.db.delete(feeds).where(eq(feeds.userId, userId));
        await ctx.db.delete(preferences).where(eq(preferences.userId, userId));
        await ctx.db.delete(sourcePreferences).where(eq(sourcePreferences.userId, userId));
        await ctx.db.delete(syncHistory).where(eq(syncHistory.userId, userId));
        await ctx.db.delete(backups).where(eq(backups.userId, userId));

        return { success: true };
    }),
});
