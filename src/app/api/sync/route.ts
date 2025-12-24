import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import {
    apiKeys, manga, chapters, categories, tracking, history, syncHistory,
    mangaCategories, preferences, sourcePreferences, extensionRepos, savedSearches, feeds
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Sync endpoint for mobile clients using REST API
// Compatible with Tachiyomi/Mihon/Komikku sync format

async function validateApiKey(request: NextRequest) {
    const apiKey = request.headers.get("x-api-key");

    if (!apiKey) {
        return null;
    }

    const keyHash = createHash("sha256").update(apiKey).digest("hex");

    const keyRecord = await db.query.apiKeys.findFirst({
        where: eq(apiKeys.keyHash, keyHash),
    });

    if (keyRecord) {
        // Update last used timestamp
        await db
            .update(apiKeys)
            .set({ lastUsedAt: new Date() })
            .where(eq(apiKeys.id, keyRecord.id));
    }

    return keyRecord;
}

// POST /api/sync - Push sync data
export async function POST(request: NextRequest) {
    const keyRecord = await validateApiKey(request);

    if (!keyRecord) {
        return NextResponse.json(
            { error: "Invalid or missing API key" },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const userId = keyRecord.userId;
        const backup = body.backup || body; // Handle wrapped or unwrapped

        // Extract all backup components
        const mangaList = backup.backupManga || backup.manga || [];
        const backupSources = backup.backupSources || [];
        const backupCategories = backup.backupCategories || [];
        const backupPreferences = backup.backupPreferences || [];
        const backupSourcePreferences = backup.backupSourcePreferences || [];
        const backupExtensionRepo = backup.backupExtensionRepo || [];
        const backupSavedSearches = backup.backupSavedSearches || [];
        const backupFeeds = backup.backupFeeds || [];

        // Create source map for name lookup
        const sourceMap = new Map<number, string>();
        if (Array.isArray(backupSources)) {
            for (const s of backupSources) {
                if (s.sourceId && s.name) {
                    sourceMap.set(Number(s.sourceId), s.name);
                }
            }
        }

        console.log("Sync request received:", {
            manga: mangaList?.length,
            categories: backupCategories?.length,
            preferences: backupPreferences?.length,
            extensionRepos: backupExtensionRepo?.length,
            savedSearches: backupSavedSearches?.length,
            feeds: backupFeeds?.length,
        });

        let mangaSynced = 0;
        let chaptersSynced = 0;

        // ============================================================================
        // Process Categories
        // ============================================================================
        const categoryMap = new Map<number, string>(); // order -> categoryId
        if (Array.isArray(backupCategories)) {
            for (const c of backupCategories) {
                const existing = await db.query.categories.findFirst({
                    where: and(eq(categories.userId, userId), eq(categories.name, c.name)),
                });

                if (existing) {
                    await db.update(categories)
                        .set({
                            order: c.order ?? existing.order,
                            flags: c.flags ?? existing.flags,
                            mangaSort: c.mangaSort,
                        })
                        .where(eq(categories.id, existing.id));
                    categoryMap.set(c.order ?? 0, existing.id);
                } else {
                    const [inserted] = await db.insert(categories)
                        .values({
                            userId,
                            name: c.name,
                            order: c.order ?? 0,
                            flags: c.flags ?? 0,
                            mangaSort: c.mangaSort,
                        })
                        .returning();
                    categoryMap.set(c.order ?? 0, inserted.id);
                }
            }
        }

        // ============================================================================
        // Process Manga
        // ============================================================================
        const failedManga: string[] = [];
        if (Array.isArray(mangaList)) {
            for (const m of mangaList) {
                try {
                    const existing = await db.query.manga.findFirst({
                        where: and(
                            eq(manga.userId, userId),
                            eq(manga.source, m.source),
                            eq(manga.url, m.url)
                        ),
                    });

                    let mangaId: string;
                    const genresArray = Array.isArray(m.genres) ? m.genres :
                        (Array.isArray(m.genre) ? m.genre :
                            (typeof m.genre === "string" ? m.genre.split(", ") : []));

                    if (existing) {
                        await db.update(manga)
                            .set({
                                title: m.title,
                                artist: m.artist,
                                author: m.author,
                                description: m.description,
                                genres: genresArray,
                                status: m.status ?? 0,
                                thumbnailUrl: m.thumbnailUrl,
                                favorite: m.favorite ?? true,
                                viewerFlags: m.viewer_flags ?? m.viewerFlags ?? -1,
                                chapterFlags: m.chapterFlags ?? 0,
                                updateStrategy: m.updateStrategy ?? "ALWAYS_UPDATE",
                                // New fields
                                notes: m.notes ?? existing.notes,
                                excludedScanlators: m.excludedScanlators ?? existing.excludedScanlators,
                                initialized: m.initialized ?? existing.initialized,
                                favoriteModifiedAt: m.favoriteModifiedAt ? new Date(m.favoriteModifiedAt) : existing.favoriteModifiedAt,
                                customTitle: m.customTitle ?? existing.customTitle,
                                customArtist: m.customArtist ?? existing.customArtist,
                                customAuthor: m.customAuthor ?? existing.customAuthor,
                                customDescription: m.customDescription ?? existing.customDescription,
                                customGenres: m.customGenre ?? existing.customGenres,
                                customStatus: m.customStatus ?? existing.customStatus,
                                customThumbnailUrl: m.customThumbnailUrl ?? existing.customThumbnailUrl,
                                // Sync metadata
                                lastModifiedAt: new Date(),
                                version: existing.version + 1,
                                sourceName: sourceMap.get(Number(m.source)) || existing.sourceName,
                            })
                            .where(eq(manga.id, existing.id));
                        mangaId = existing.id;
                    } else {
                        const [inserted] = await db.insert(manga)
                            .values({
                                userId,
                                source: m.source,
                                sourceName: sourceMap.get(Number(m.source)),
                                url: m.url,
                                title: m.title,
                                artist: m.artist,
                                author: m.author,
                                description: m.description,
                                genres: genresArray,
                                status: m.status ?? 0,
                                thumbnailUrl: m.thumbnailUrl,
                                favorite: m.favorite ?? true,
                                dateAdded: m.dateAdded ? new Date(m.dateAdded) : new Date(),
                                viewerFlags: m.viewer_flags ?? m.viewerFlags ?? -1,
                                chapterFlags: m.chapterFlags ?? 0,
                                updateStrategy: m.updateStrategy ?? "ALWAYS_UPDATE",
                                // New fields
                                notes: m.notes,
                                excludedScanlators: m.excludedScanlators,
                                initialized: m.initialized ?? false,
                                favoriteModifiedAt: m.favoriteModifiedAt ? new Date(m.favoriteModifiedAt) : null,
                                customTitle: m.customTitle,
                                customArtist: m.customArtist,
                                customAuthor: m.customAuthor,
                                customDescription: m.customDescription,
                                customGenres: m.customGenre,
                                customStatus: m.customStatus ?? 0,
                                customThumbnailUrl: m.customThumbnailUrl,
                            })
                            .returning();
                        mangaId = inserted.id;
                    }
                    mangaSynced++;

                    // Process manga categories
                    if (m.categories && Array.isArray(m.categories)) {
                        // Delete existing manga-category links
                        await db.delete(mangaCategories).where(eq(mangaCategories.mangaId, mangaId));

                        // Create new links
                        for (const catOrder of m.categories) {
                            const categoryId = categoryMap.get(Number(catOrder));
                            if (categoryId) {
                                await db.insert(mangaCategories)
                                    .values({ mangaId, categoryId })
                                    .onConflictDoNothing();
                            }
                        }
                    }

                    // Process chapters
                    if (m.chapters && Array.isArray(m.chapters)) {
                        for (const ch of m.chapters) {
                            const existingChapter = await db.query.chapters.findFirst({
                                where: and(
                                    eq(chapters.mangaId, mangaId),
                                    eq(chapters.url, ch.url)
                                ),
                            });

                            if (existingChapter) {
                                await db.update(chapters)
                                    .set({
                                        name: ch.name ?? existingChapter.name,
                                        read: ch.read ?? existingChapter.read,
                                        bookmark: ch.bookmark ?? existingChapter.bookmark,
                                        lastPageRead: ch.lastPageRead ?? ch.last_page_read ?? existingChapter.lastPageRead,
                                        sourceOrder: ch.sourceOrder ?? existingChapter.sourceOrder,
                                        dateFetch: ch.dateFetch ? new Date(ch.dateFetch) : existingChapter.dateFetch,
                                        dateUpload: ch.dateUpload ? new Date(ch.dateUpload) : existingChapter.dateUpload,
                                        lastModifiedAt: new Date(),
                                        version: (existingChapter.version ?? 0) + 1,
                                    })
                                    .where(eq(chapters.id, existingChapter.id));
                            } else {
                                await db.insert(chapters).values({
                                    mangaId,
                                    url: ch.url,
                                    name: ch.name ?? "",
                                    scanlator: ch.scanlator,
                                    chapterNumber: ch.chapterNumber ?? ch.chapter_number ?? 0,
                                    sourceOrder: ch.sourceOrder ?? 0,
                                    read: ch.read ?? false,
                                    bookmark: ch.bookmark ?? false,
                                    lastPageRead: ch.lastPageRead ?? ch.last_page_read ?? 0,
                                    pagesLeft: ch.pagesLeft ?? ch.pages_left ?? 0,
                                    dateFetch: ch.dateFetch ? new Date(ch.dateFetch) : null,
                                    dateUpload: ch.dateUpload ? new Date(ch.dateUpload) : null,
                                });
                            }
                            chaptersSynced++;
                        }
                    }

                    // Process tracking
                    if (m.tracking && Array.isArray(m.tracking)) {
                        for (const t of m.tracking) {
                            const existingTrack = await db.query.tracking.findFirst({
                                where: and(
                                    eq(tracking.mangaId, mangaId),
                                    eq(tracking.syncId, t.syncId)
                                ),
                            });

                            const mediaId = t.mediaId ?? t.mediaIdInt ?? 0;

                            if (existingTrack) {
                                await db.update(tracking)
                                    .set({
                                        mediaId,
                                        libraryId: t.libraryId,
                                        title: t.title,
                                        trackingUrl: t.trackingUrl,
                                        lastChapterRead: t.lastChapterRead ?? 0,
                                        totalChapters: t.totalChapters ?? 0,
                                        score: t.score ?? 0,
                                        status: t.status ?? 0,
                                        startedReadingDate: t.startedReadingDate ? new Date(t.startedReadingDate) : null,
                                        finishedReadingDate: t.finishedReadingDate ? new Date(t.finishedReadingDate) : null,
                                        private: t.private ?? false,
                                    })
                                    .where(eq(tracking.id, existingTrack.id));
                            } else {
                                await db.insert(tracking).values({
                                    mangaId,
                                    syncId: t.syncId,
                                    mediaId,
                                    libraryId: t.libraryId,
                                    title: t.title,
                                    trackingUrl: t.trackingUrl,
                                    lastChapterRead: t.lastChapterRead ?? 0,
                                    totalChapters: t.totalChapters ?? 0,
                                    score: t.score ?? 0,
                                    status: t.status ?? 0,
                                    startedReadingDate: t.startedReadingDate ? new Date(t.startedReadingDate) : null,
                                    finishedReadingDate: t.finishedReadingDate ? new Date(t.finishedReadingDate) : null,
                                    private: t.private ?? false,
                                });
                            }
                        }
                    }

                    // Process history
                    if (m.history && Array.isArray(m.history)) {
                        for (const h of m.history) {
                            const chapterUrl = h.url || h.chapterUrl;
                            if (!chapterUrl) continue;

                            const existingHistory = await db.query.history.findFirst({
                                where: and(
                                    eq(history.mangaId, mangaId),
                                    eq(history.chapterUrl, chapterUrl)
                                ),
                            });

                            if (existingHistory) {
                                await db.update(history)
                                    .set({
                                        lastRead: new Date(h.lastRead),
                                        readDuration: h.readDuration ?? 0,
                                    })
                                    .where(eq(history.id, existingHistory.id));
                            } else {
                                await db.insert(history).values({
                                    mangaId,
                                    chapterUrl,
                                    lastRead: new Date(h.lastRead),
                                    readDuration: h.readDuration ?? 0,
                                });
                            }
                        }
                    }

                } catch (e) {
                    console.error(`Failed to process manga ${m.title}:`, e);
                    failedManga.push(m.title);
                }
            }
        }

        // ============================================================================
        // Process Preferences
        // ============================================================================
        if (Array.isArray(backupPreferences)) {
            for (const p of backupPreferences) {
                const existing = await db.query.preferences.findFirst({
                    where: and(eq(preferences.userId, userId), eq(preferences.key, p.key)),
                });

                if (existing) {
                    await db.update(preferences)
                        .set({ value: p.value, type: p.value?.type || "string" })
                        .where(eq(preferences.id, existing.id));
                } else {
                    await db.insert(preferences).values({
                        userId,
                        key: p.key,
                        value: p.value,
                        type: p.value?.type || "string",
                    });
                }
            }
        }

        // ============================================================================
        // Process Source Preferences
        // ============================================================================
        if (Array.isArray(backupSourcePreferences)) {
            for (const sp of backupSourcePreferences) {
                const sourceKey = sp.sourceKey ?? sp.source;
                if (!sourceKey) continue;

                const existing = await db.query.sourcePreferences.findFirst({
                    where: and(eq(sourcePreferences.userId, userId), eq(sourcePreferences.sourceId, sourceKey)),
                });

                if (existing) {
                    await db.update(sourcePreferences)
                        .set({ preferences: sp.prefs })
                        .where(eq(sourcePreferences.id, existing.id));
                } else {
                    await db.insert(sourcePreferences).values({
                        userId,
                        sourceId: sourceKey,
                        preferences: sp.prefs,
                    });
                }
            }
        }

        // ============================================================================
        // Process Extension Repos
        // ============================================================================
        if (Array.isArray(backupExtensionRepo)) {
            for (const repo of backupExtensionRepo) {
                const existing = await db.query.extensionRepos.findFirst({
                    where: and(eq(extensionRepos.userId, userId), eq(extensionRepos.baseUrl, repo.baseUrl)),
                });

                if (!existing && repo.baseUrl && repo.name) {
                    await db.insert(extensionRepos).values({
                        userId,
                        baseUrl: repo.baseUrl,
                        name: repo.name,
                        shortName: repo.shortName,
                        website: repo.website,
                        signingKeyFingerprint: repo.signingKeyFingerprint,
                    });
                }
            }
        }

        // ============================================================================
        // Process Saved Searches
        // ============================================================================
        if (Array.isArray(backupSavedSearches)) {
            for (const ss of backupSavedSearches) {
                const existing = await db.query.savedSearches.findFirst({
                    where: and(
                        eq(savedSearches.userId, userId),
                        eq(savedSearches.name, ss.name),
                        eq(savedSearches.source, ss.source)
                    ),
                });

                if (!existing && ss.name && ss.source) {
                    await db.insert(savedSearches).values({
                        userId,
                        name: ss.name,
                        source: ss.source,
                        query: ss.query,
                        filterList: ss.filterList,
                    });
                }
            }
        }

        // ============================================================================
        // Process Feeds
        // ============================================================================
        if (Array.isArray(backupFeeds)) {
            for (const f of backupFeeds) {
                const existing = await db.query.feeds.findFirst({
                    where: and(eq(feeds.userId, userId), eq(feeds.source, f.source)),
                });

                if (!existing && f.source) {
                    await db.insert(feeds).values({
                        userId,
                        source: f.source,
                        savedSearchId: f.savedSearch,
                        global: f.global ?? true,
                    });
                }
            }
        }

        // Log sync
        await db.insert(syncHistory).values({
            userId,
            deviceName: keyRecord.deviceName ?? "Unknown",
            syncType: "push",
            mangaSynced,
            chaptersSynced,
            status: failedManga.length > 0 ? "partial" : "success",
            errorMessage: failedManga.length > 0 ? `Failed: ${failedManga.join(", ")}` : null,
        });

        return NextResponse.json({
            success: true,
            mangaSynced,
            chaptersSynced,
            failedManga: failedManga.length > 0 ? failedManga : undefined,
        });
    } catch (error) {
        console.error("Sync push error:", error);
        if (error instanceof Error) {
            console.error("Stack:", error.stack);
        }
        return NextResponse.json(
            { error: "Sync failed", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}

// GET /api/sync - Pull sync data
export async function GET(request: NextRequest) {
    const keyRecord = await validateApiKey(request);

    if (!keyRecord) {
        return NextResponse.json(
            { error: "Invalid or missing API key" },
            { status: 401 }
        );
    }

    try {
        const userId = keyRecord.userId;

        // Fetch all manga with relations
        const mangaList = await db.query.manga.findMany({
            where: eq(manga.userId, userId),
            with: {
                chapters: true,
                tracking: true,
                history: true,
                mangaCategories: true,
            },
        });

        // Fetch other data
        const categoriesList = await db.query.categories.findMany({
            where: eq(categories.userId, userId),
        });

        const preferencesList = await db.query.preferences.findMany({
            where: eq(preferences.userId, userId),
        });

        const sourcePreferencesList = await db.query.sourcePreferences.findMany({
            where: eq(sourcePreferences.userId, userId),
        });

        const extensionReposList = await db.query.extensionRepos.findMany({
            where: eq(extensionRepos.userId, userId),
        });

        const savedSearchesList = await db.query.savedSearches.findMany({
            where: eq(savedSearches.userId, userId),
        });

        const feedsList = await db.query.feeds.findMany({
            where: eq(feeds.userId, userId),
        });

        // Build category order map for manga
        const categoryOrderMap = new Map<string, number>();
        categoriesList.forEach(c => categoryOrderMap.set(c.id, c.order ?? 0));

        // Log sync
        await db.insert(syncHistory).values({
            userId,
            deviceName: keyRecord.deviceName ?? "Unknown",
            syncType: "pull",
            mangaSynced: mangaList.length,
            chaptersSynced: mangaList.reduce((sum, m) => sum + m.chapters.length, 0),
            status: "success",
        });

        // Build unique sources list
        const sourcesSet = new Map<number, string>();
        mangaList.forEach(m => {
            if (m.sourceName) {
                sourcesSet.set(Number(m.source), m.sourceName);
            }
        });

        return NextResponse.json({
            backupManga: mangaList.map((m) => ({
                source: m.source,
                url: m.url,
                title: m.title ?? "",
                artist: m.artist,
                author: m.author,
                description: m.description,
                genre: m.genres ?? [],
                status: m.status ?? 0,
                thumbnailUrl: m.thumbnailUrl,
                dateAdded: m.dateAdded?.getTime() ?? 0,
                viewer: 0,
                chapters: m.chapters.map((ch) => ({
                    url: ch.url,
                    name: ch.name ?? "",
                    scanlator: ch.scanlator,
                    read: ch.read ?? false,
                    bookmark: ch.bookmark ?? false,
                    lastPageRead: ch.lastPageRead ?? 0,
                    dateFetch: ch.dateFetch?.getTime() ?? 0,
                    dateUpload: ch.dateUpload?.getTime() ?? 0,
                    chapterNumber: ch.chapterNumber ?? 0,
                    sourceOrder: ch.sourceOrder ?? 0,
                })),
                categories: m.mangaCategories?.map(mc => categoryOrderMap.get(mc.categoryId) ?? 0) ?? [],
                tracking: m.tracking.map((t) => ({
                    syncId: t.syncId,
                    libraryId: t.libraryId ?? 0,
                    mediaId: t.mediaId ?? 0,
                    trackingUrl: t.trackingUrl ?? "",
                    title: t.title ?? "",
                    lastChapterRead: t.lastChapterRead ?? 0,
                    totalChapters: t.totalChapters ?? 0,
                    score: t.score ?? 0,
                    status: t.status ?? 0,
                    startedReadingDate: t.startedReadingDate?.getTime() ?? 0,
                    finishedReadingDate: t.finishedReadingDate?.getTime() ?? 0,
                })),
                favorite: m.favorite ?? true,
                chapterFlags: m.chapterFlags ?? 0,
                viewer_flags: m.viewerFlags ?? 0,
                history: m.history.map((h) => ({
                    url: h.chapterUrl,
                    lastRead: h.lastRead.getTime(),
                    readDuration: h.readDuration ?? 0,
                })),
            })),
            backupCategories: categoriesList.map((c) => ({
                name: c.name,
                order: c.order ?? 0,
                flags: c.flags ?? 0,
            })),
            backupSources: Array.from(sourcesSet.entries()).map(([sourceId, name]) => ({
                sourceId,
                name,
            })),
        });
    } catch (error) {
        console.error("Sync pull error:", error);
        return NextResponse.json(
            { error: "Sync failed", details: error instanceof Error ? error.message : "Unknown" },
            { status: 500 }
        );
    }
}
