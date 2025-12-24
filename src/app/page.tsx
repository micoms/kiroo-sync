"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Book, BookOpen, CheckCircle, Clock, RefreshCw, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();

  useEffect(() => {
    if (!sessionLoading && !session) {
      router.push("/login");
    }
  }, [session, sessionLoading, router]);

  const { data: stats, isLoading: statsLoading } = trpc.manga.stats.useQuery(undefined, {
    enabled: !!session,
  });
  const { data: syncStatus, isLoading: syncLoading } = trpc.sync.status.useQuery(undefined, {
    enabled: !!session,
  });
  const { data: recentHistory } = trpc.sync.history.useQuery({ limit: 5 }, {
    enabled: !!session,
  });

  // Show loading while checking session
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!session) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to Kiroo Sync - your manga synchronization hub
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Manga</CardTitle>
              <Book className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalManga ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {stats?.favoriteManga ?? 0} favorites
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chapters Read</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">{stats?.readChapters ?? 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                of {stats?.totalChapters ?? 0} total chapters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {stats?.completionRate?.toFixed(1) ?? 0}%
                </div>
              )}
              <p className="text-xs text-muted-foreground">reading progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {syncLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">
                  {syncStatus?.lastSync
                    ? formatDistanceToNow(syncStatus.lastSync, { addSuffix: true })
                    : "Never"}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                <Badge
                  variant={syncStatus?.status === "success" ? "default" : "secondary"}
                  className="mt-1"
                >
                  {syncStatus?.status ?? "No syncs yet"}
                </Badge>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sync Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Sync Activity
            </CardTitle>
            <CardDescription>Your recent synchronization history</CardDescription>
          </CardHeader>
          <CardContent>
            {!recentHistory || recentHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No sync activity yet</p>
                <p className="text-sm">Generate an API key and sync from your device to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full ${item.status === "success"
                          ? "bg-green-500"
                          : item.status === "failed"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                          }`}
                      />
                      <div>
                        <p className="font-medium capitalize">{item.syncType} Sync</p>
                        <p className="text-sm text-muted-foreground">
                          {item.deviceName ?? "Unknown device"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {item.mangaSynced} manga, {item.chaptersSynced} chapters
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
