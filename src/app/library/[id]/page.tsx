"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc/client";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Book, BookOpen, Calendar, Check, CheckCircle2, Clock, Eye, Heart, MapPin, Share2, Star, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function MangaDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [activeTab, setActiveTab] = useState("chapters");

    const { data: manga, isLoading } = trpc.manga.get.useQuery({ id }, { enabled: !!id });
    const { data: stats } = trpc.manga.stats.useQuery();

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-64" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <div className="grid gap-6 md:grid-cols-[300px_1fr]">
                        <Skeleton className="h-[450px] w-full rounded-xl" />
                        <div className="space-y-6">
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-96 w-full" />
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    if (!manga) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Book className="h-20 w-20 text-muted-foreground mb-6" />
                    <h1 className="text-2xl font-bold">Manga Not Found</h1>
                    <p className="text-muted-foreground max-w-md mt-2 mb-8">
                        This manga doesn't exist in your library or may have been removed.
                    </p>
                    <Button onClick={() => router.push("/library")}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Library
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 pb-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => router.push("/library")}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold truncate max-w-[300px] sm:max-w-md lg:max-w-xl" title={manga.title}>
                                {manga.title}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {manga.author && (
                                    <div className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        <span>{manga.author}</span>
                                    </div>
                                )}
                                {manga.status !== null && (
                                    <Badge variant="outline" className="ml-2 text-xs h-5">
                                        {manga.status === 1 ? "Ongoing" : manga.status === 2 ? "Completed" : "Unknown Status"}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {manga.favorite && (
                            <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-500">
                                <Star className="h-3 w-3 fill-current" />
                                Favorite
                            </Badge>
                        )}
                        <Button variant="outline" size="sm">
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                        </Button>
                    </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
                    {/* Left Sidebar - Cover & Info */}
                    <div className="space-y-6">
                        <div className="rounded-xl overflow-hidden border shadow-sm bg-muted aspect-[2/3] relative group">
                            {manga.thumbnailUrl ? (
                                <img
                                    src={manga.thumbnailUrl}
                                    alt={manga.title}
                                    className="object-cover w-full h-full shadow-md transition-transform duration-500 group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full bg-secondary/30">
                                    <Book className="h-20 w-20 text-muted-foreground/30" />
                                </div>
                            )}
                        </div>

                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider">Artist</span>
                                    <span className="font-medium">{manga.artist || "Unknown"}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider">Source</span>
                                    <span className="font-medium flex items-center gap-2">
                                        <MapPin className="h-3 w-3" />
                                        {manga.source}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider">Genres</span>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {manga.genres?.map((genre) => (
                                            <Badge key={genre} variant="secondary" className="text-[10px] px-1.5 h-5">
                                                {genre}
                                            </Badge>
                                        )) || <span className="text-muted-foreground italic">No genres</span>}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider">Last Updated</span>
                                    <span className="font-medium flex items-center gap-2">
                                        <Calendar className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(manga.lastModifiedAt), { addSuffix: true })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Main Content */}
                    <div className="space-y-6">
                        {/* Description */}
                        {manga.description && (
                            <Card>
                                <CardContent className="pt-6">
                                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                                        {manga.description}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card>
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <span className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Total Chapters</span>
                                    <span className="text-2xl font-bold">{manga.chapters.length}</span>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <span className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Read</span>
                                    <span className="text-2xl font-bold text-primary">
                                        {manga.chapters.filter(c => c.read).length}
                                    </span>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <span className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Progress</span>
                                    <span className="text-2xl font-bold">
                                        {manga.chapters.length > 0
                                            ? Math.round((manga.chapters.filter(c => c.read).length / manga.chapters.length) * 100)
                                            : 0}%
                                    </span>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <span className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Missing</span>
                                    <span className="text-2xl font-bold text-muted-foreground">
                                        {manga.chapters.length - manga.chapters.filter(c => c.read).length}
                                    </span>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Tabs */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                                <TabsTrigger
                                    value="chapters"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 data-[state=active]:text-foreground text-muted-foreground transition-none"
                                >
                                    Chapters
                                </TabsTrigger>
                                <TabsTrigger
                                    value="history"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 data-[state=active]:text-foreground text-muted-foreground transition-none"
                                >
                                    Reading History
                                </TabsTrigger>
                                <TabsTrigger
                                    value="tracking"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 py-3 data-[state=active]:text-foreground text-muted-foreground transition-none"
                                >
                                    Tracking
                                </TabsTrigger>
                            </TabsList>

                            {/* Chapters Tab */}
                            <TabsContent value="chapters" className="pt-6">
                                <Card>
                                    <CardHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                                        <CardTitle className="text-base">Chapter List</CardTitle>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Eye className="h-3 w-3 text-primary" /> Read
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye className="h-3 w-3 text-muted-foreground/30" /> Unread
                                            </span>
                                        </div>
                                    </CardHeader>
                                    <div className="max-h-[600px] overflow-y-auto">
                                        {manga.chapters.length === 0 ? (
                                            <div className="p-8 text-center text-muted-foreground">
                                                No chapters found.
                                            </div>
                                        ) : (
                                            <div className="divide-y">
                                                {manga.chapters.map((chapter) => (
                                                    <div key={chapter.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                                        <div className="flex-1 min-w-0 pr-4">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h4 className={`font-medium truncate ${chapter.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                                                                    {chapter.name}
                                                                </h4>
                                                                {chapter.read && (
                                                                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                                <span>Ch. {chapter.chapterNumber}</span>
                                                                {chapter.dateUpload && (
                                                                    <span className="flex items-center gap-1">
                                                                        <Calendar className="h-3 w-3" />
                                                                        {new Date(chapter.dateUpload).toLocaleDateString()}
                                                                    </span>
                                                                )}
                                                                {chapter.scanlator && (
                                                                    <span className="truncate max-w-[150px] bg-secondary px-1.5 py-0.5 rounded">
                                                                        {chapter.scanlator}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant={chapter.read ? "ghost" : "outline"}
                                                                size="sm"
                                                                className={`h-8 w-8 p-0 rounded-full ${chapter.read ? 'bg-primary/10 text-primary hover:bg-primary/20' : ''}`}
                                                                title={chapter.read ? "Mark as unread" : "Mark as read"}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </TabsContent>

                            {/* History Tab */}
                            <TabsContent value="history" className="pt-6">
                                <Card>
                                    <CardContent className="p-6">
                                        {!manga.history || manga.history.length === 0 ? (
                                            <div className="text-center py-10 text-muted-foreground">
                                                <Clock className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                                <p>No reading history available yet.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {manga.history.map((h) => (
                                                    <div key={h.id} className="flex gap-4 items-start relative pl-6 border-l-2 border-muted hover:border-primary transition-colors pb-6 last:pb-0">
                                                        <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-background border-2 border-primary" />
                                                        <div className="space-y-1">
                                                            <p className="text-sm font-medium">Read Chapter</p>
                                                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(h.lastRead), { addSuffix: true })}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Tracking Tab */}
                            <TabsContent value="tracking" className="pt-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">External Tracking</CardTitle>
                                        <CardDescription>Synced from AniList, MyAnimeList, etc.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {!manga.tracking || manga.tracking.length === 0 ? (
                                            <div className="text-center py-10 text-muted-foreground">
                                                <MapPin className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                                <p>No trackers synced for this manga.</p>
                                            </div>
                                        ) : (
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                {manga.tracking.map((track) => (
                                                    <div key={track.id} className="border rounded-lg p-4 bg-card hover:bg-muted/50 transition-colors">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <Badge variant="outline" className="uppercase font-bold">
                                                                Service ID: {track.syncId}
                                                            </Badge>
                                                            <div className="flex items-center gap-1 text-sm font-medium text-primary">
                                                                <Star className="h-3 w-3 fill-current" />
                                                                {(track.score ?? 0) > 0 ? track.score : '-'}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2 text-sm">
                                                            <div className="flex justify-between py-1 border-b border-border/50">
                                                                <span className="text-muted-foreground">Status</span>
                                                                <span className="font-medium">
                                                                    {track.status === 1 ? "Reading" :
                                                                        track.status === 2 ? "Completed" :
                                                                            track.status === 3 ? "On Hold" :
                                                                                track.status === 4 ? "Dropped" :
                                                                                    track.status === 5 ? "Plan to Read" : "Unknown"}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between py-1">
                                                                <span className="text-muted-foreground">Progress</span>
                                                                <span className="font-medium">{track.lastChapterRead} / {track.totalChapters || '?'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
