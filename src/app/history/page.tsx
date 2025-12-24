"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, RefreshCw, BookOpen, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import Image from "next/image";

export default function HistoryPage() {
    const { data: readingHistory, isLoading: isLoadingReading } = trpc.manga.readingHistory.useQuery({ limit: 50 });
    const { data: syncHistory, isLoading: isLoadingSync } = trpc.sync.history.useQuery({ limit: 50 });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">History</h1>
                    <p className="text-muted-foreground">
                        View your reading history and synchronization logs
                    </p>
                </div>

                <Tabs defaultValue="reading" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="reading">Reading History</TabsTrigger>
                        <TabsTrigger value="sync">Sync Logs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="reading" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>Your recently read chapters</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingReading ? (
                                    <div className="space-y-4">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className="flex items-center gap-4">
                                                <Skeleton className="h-12 w-8" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-40" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : !readingHistory || readingHistory.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold">No reading history</h3>
                                        <p className="text-muted-foreground mt-2">
                                            Start reading manga to see your history here.
                                        </p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Manga</TableHead>
                                                <TableHead>Chapter</TableHead>
                                                <TableHead>Last Read</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {readingHistory.map((item) => (
                                                <TableRow key={item.historyId}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            {item.mangaThumbnail ? (
                                                                <div className="relative h-12 w-8 overflow-hidden rounded bg-muted shrink-0">
                                                                    <Image
                                                                        src={item.mangaThumbnail}
                                                                        alt={item.mangaTitle}
                                                                        fill
                                                                        className="object-cover"
                                                                        sizes="32px"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="h-12 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                                                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <Link href={`/library/${item.mangaId}`} className="font-medium hover:underline block">
                                                                    {item.mangaTitle}
                                                                </Link>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {item.sourceName || "Unknown Source"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">
                                                                {item.chapterNumber ? `Ch. ${item.chapterNumber}` : "Chapter"}
                                                            </span>
                                                            {item.chapterName && (
                                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={item.chapterName}>
                                                                    {item.chapterName}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                                                        {formatDistanceToNow(new Date(item.lastRead), { addSuffix: true })}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="sync" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Sync Logs</CardTitle>
                                <CardDescription>History of device synchronization</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoadingSync ? (
                                    <div className="space-y-4">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <div key={i} className="flex items-center gap-4 py-4 border-b last:border-0">
                                                <Skeleton className="h-8 w-20" />
                                                <Skeleton className="h-6 w-32" />
                                                <Skeleton className="h-6 w-24" />
                                            </div>
                                        ))}
                                    </div>
                                ) : !syncHistory || syncHistory.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <History className="h-16 w-16 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold">No sync history</h3>
                                        <p className="text-muted-foreground mt-2">
                                            Your sync activity will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Device</TableHead>
                                                <TableHead>Manga</TableHead>
                                                <TableHead>Chapters</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Time</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {syncHistory.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell>
                                                        <Badge variant="outline" className="capitalize">
                                                            <RefreshCw className="mr-1 h-3 w-3" />
                                                            {item.syncType}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {item.deviceName ?? "Unknown"}
                                                    </TableCell>
                                                    <TableCell>{item.mangaSynced}</TableCell>
                                                    <TableCell>{item.chaptersSynced}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={
                                                                item.status === "success"
                                                                    ? "default"
                                                                    : item.status === "failed"
                                                                        ? "destructive"
                                                                        : "secondary"
                                                            }
                                                        >
                                                            {item.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                                                        {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
