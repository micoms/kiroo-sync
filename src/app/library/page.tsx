"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Book, Search, Grid, List, Star, BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

export default function LibraryPage() {
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const { data: mangaList, isLoading } = trpc.manga.list.useQuery({
        limit: 50,
        search: search || undefined,
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Library</h1>
                        <p className="text-muted-foreground">
                            Browse your synced manga collection
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={viewMode === "grid" ? "default" : "outline"}
                            size="icon"
                            onClick={() => setViewMode("grid")}
                        >
                            <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "default" : "outline"}
                            size="icon"
                            onClick={() => setViewMode("list")}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search manga by title, author, or artist..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "space-y-4"}>
                        {Array.from({ length: 10 }).map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-4">
                                    <Skeleton className="h-48 w-full mb-2" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <Skeleton className="h-3 w-1/2 mt-2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : !mangaList || mangaList.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Book className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No manga synced yet</h3>
                            <p className="text-muted-foreground text-center max-w-md mt-2">
                                Generate an API key and sync your library from your Tachiyomi/Mihon app to see your manga here.
                            </p>
                        </CardContent>
                    </Card>
                ) : viewMode === "grid" ? (
                    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {mangaList.map((m) => (
                            <Link href={`/library/${m.id}`} key={m.id} className="block group">
                                <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                                    <div className="aspect-[2/3] relative bg-muted group-hover:scale-105 transition-transform duration-300">
                                        {m.thumbnailUrl ? (
                                            <img
                                                src={m.thumbnailUrl}
                                                alt={m.title}
                                                className="object-cover w-full h-full"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full bg-secondary/50">
                                                <Book className="h-12 w-12 text-muted-foreground/50" />
                                            </div>
                                        )}
                                        {m.favorite && (
                                            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm p-1 rounded-full">
                                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-white">
                                            <p className="text-xs font-medium truncate">{m.author || "Unknown"}</p>
                                        </div>
                                    </div>
                                    <CardContent className="p-3">
                                        <h3 className="font-medium line-clamp-2 text-sm leading-tight h-10 mb-2 group-hover:text-primary transition-colors">
                                            {m.title}
                                        </h3>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <BookOpen className="h-3 w-3" />
                                                <span>{m.readChapters}/{m.totalChapters}</span>
                                            </div>
                                            {m.status && (
                                                <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                                                    {m.status === 1 ? "Ongoing" : m.status === 2 ? "Completed" : "Unknown"}
                                                </Badge>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {mangaList.map((m) => (
                            <Link href={`/library/${m.id}`} key={m.id} className="block group">
                                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                    <CardContent className="flex items-center gap-4 p-4">
                                        <div className="h-16 w-12 bg-muted rounded overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                                            {m.thumbnailUrl ? (
                                                <img
                                                    src={m.thumbnailUrl}
                                                    alt={m.title}
                                                    className="object-cover w-full h-full"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full">
                                                    <Book className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium truncate group-hover:text-primary transition-colors">{m.title}</h3>
                                                {m.favorite && <Star className="h-4 w-4 fill-yellow-500 text-yellow-500 flex-shrink-0" />}
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {m.author || m.artist || "Unknown author"}
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0 flex items-center gap-4">
                                            {m.status && (
                                                <Badge variant="secondary" className="hidden sm:inline-flex">
                                                    {m.status === 1 ? "Ongoing" : m.status === 2 ? "Completed" : "Unknown"}
                                                </Badge>
                                            )}
                                            <Badge variant="outline">
                                                {m.readChapters}/{m.totalChapters} read
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
