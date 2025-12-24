"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { History, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryPage() {
    const { data: historyList, isLoading } = trpc.sync.history.useQuery({ limit: 50 });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Sync History</h1>
                    <p className="text-muted-foreground">
                        View your synchronization activity
                    </p>
                </div>

                {isLoading ? (
                    <Card>
                        <CardContent className="p-6">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-4 py-4 border-b last:border-0">
                                    <Skeleton className="h-8 w-20" />
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-6 w-24" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ) : !historyList || historyList.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <History className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No sync history yet</h3>
                            <p className="text-muted-foreground text-center max-w-md mt-2">
                                Your sync activity will appear here once you start syncing from your devices.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
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
                                {historyList.map((item) => (
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
                                        <TableCell className="text-muted-foreground">
                                            {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
