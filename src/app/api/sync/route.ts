import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { apiKeys, manga, chapters, categories, tracking, history, syncHistory } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// Sync endpoint for mobile clients using REST API
// Compatible with Tachiyomi/Mihon sync format

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
        let mangaSynced = 0;
        let chaptersSynced = 0;

        // Process manga
        if (body.manga && Array.isArray(body.manga)) {
            for (const m of body.manga) {
                const existing = await db.query.manga.findFirst({
                    where: and(
                        eq(manga.userId, userId),
                        eq(manga.source, m.source),
                        eq(manga.url, m.url)
                    ),
                });

                let mangaId: string;

                if (existing) {
                    await db.update(manga)
                        .set({
                            title: m.title,
                            artist: m.artist,
                            author: m.author,
                            description: m.description,
                            genres: m.genres || m.genre?.split(", "),
                            status: m.status ?? 0,
                            thumbnailUrl: m.thumbnailUrl,
                            favorite: m.favorite ?? true,
                            viewerFlags: m.viewer_flags ?? m.viewerFlags ?? -1,
                            chapterFlags: m.chapterFlags ?? 0,
                            lastModifiedAt: new Date(),
                            version: existing.version + 1,
                        })
                        .where(eq(manga.id, existing.id));
                    mangaId = existing.id;
                } else {
                    const [inserted] = await db.insert(manga)
                        .values({
                            userId,
                            source: m.source,
                            url: m.url,
                            title: m.title,
                            artist: m.artist,
                            author: m.author,
                            description: m.description,
                            genres: m.genres || m.genre?.split(", "),
                            status: m.status ?? 0,
                            thumbnailUrl: m.thumbnailUrl,
                            favorite: m.favorite ?? true,
                            dateAdded: m.dateAdded ? new Date(m.dateAdded) : new Date(),
                            viewerFlags: m.viewer_flags ?? m.viewerFlags ?? -1,
                            chapterFlags: m.chapterFlags ?? 0,
                        })
                        .returning();
                    mangaId = inserted.id;
                }
                mangaSynced++;

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
                                    read: ch.read ?? false,
                                    bookmark: ch.bookmark ?? false,
                                    lastPageRead: ch.lastPageRead ?? ch.last_page_read ?? 0,
                                    lastModifiedAt: new Date(),
                                })
                                .where(eq(chapters.id, existingChapter.id));
                        } else {
                            await db.insert(chapters).values({
                                mangaId,
                                url: ch.url,
                                name: ch.name,
                                scanlator: ch.scanlator,
                                chapterNumber: ch.chapterNumber ?? ch.chapter_number ?? 0,
                                read: ch.read ?? false,
                                bookmark: ch.bookmark ?? false,
                                lastPageRead: ch.lastPageRead ?? ch.last_page_read ?? 0,
                                pagesLeft: ch.pagesLeft ?? ch.pages_left ?? 0,
                            });
                        }
                        chaptersSynced++;
                    }
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
            status: "success",
        });

        return NextResponse.json({
            success: true,
            mangaSynced,
            chaptersSynced,
        });
    } catch (error) {
        console.error("Sync push error:", error);
        return NextResponse.json(
            { error: "Sync failed", details: error instanceof Error ? error.message : "Unknown" },
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

        const mangaList = await db.query.manga.findMany({
            where: eq(manga.userId, userId),
            with: {
                chapters: true,
                tracking: true,
                history: true,
            },
        });

        const categoriesList = await db.query.categories.findMany({
            where: eq(categories.userId, userId),
        });

        // Log sync
        await db.insert(syncHistory).values({
            userId,
            deviceName: keyRecord.deviceName ?? "Unknown",
            syncType: "pull",
            mangaSynced: mangaList.length,
            chaptersSynced: mangaList.reduce((sum, m) => sum + m.chapters.length, 0),
            status: "success",
        });

        return NextResponse.json({
            backupManga: mangaList.map((m) => ({
                source: m.source,
                url: m.url,
                title: m.title,
                artist: m.artist,
                author: m.author,
                description: m.description,
                genre: m.genres?.join(", "),
                status: m.status,
                thumbnailUrl: m.thumbnailUrl,
                favorite: m.favorite,
                dateAdded: m.dateAdded?.getTime(),
                viewer_flags: m.viewerFlags,
                chapterFlags: m.chapterFlags,
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
                    mediaId: Number(t.mediaId),
                    libraryId: t.libraryId ? Number(t.libraryId) : null,
                    title: t.title,
                    trackingUrl: t.trackingUrl,
                    lastChapterRead: t.lastChapterRead,
                    totalChapters: t.totalChapters,
                    score: t.score,
                    status: t.status,
                })),
                history: m.history.map((h) => ({
                    url: h.chapterUrl,
                    lastRead: h.lastRead.getTime(),
                    readDuration: h.readDuration,
                })),
            })),
            backupCategories: categoriesList.map((c) => ({
                name: c.name,
                order: c.order,
                flags: c.flags,
                mangaSort: c.mangaSort,
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
