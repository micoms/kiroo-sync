"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Search, Rss, FolderOpen, Settings, Database, Trash2, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export default function DataPage() {
    const { data: stats, isLoading: statsLoading } = trpc.data.stats.useQuery();
    const { data: categories, isLoading: categoriesLoading } = trpc.data.categories.useQuery();
    const { data: extensionRepos, isLoading: reposLoading } = trpc.data.extensionRepos.useQuery();
    const { data: savedSearches, isLoading: searchesLoading } = trpc.data.savedSearches.useQuery();
    const { data: feeds, isLoading: feedsLoading } = trpc.data.feeds.useQuery();
    const { data: preferences, isLoading: prefsLoading } = trpc.data.preferences.useQuery();

    const utils = trpc.useUtils();

    const deleteRepoMutation = trpc.data.deleteExtensionRepo.useMutation({
        onSuccess: () => utils.data.extensionRepos.invalidate(),
    });
    const deleteSearchMutation = trpc.data.deleteSavedSearch.useMutation({
        onSuccess: () => utils.data.savedSearches.invalidate(),
    });
    const deleteFeedMutation = trpc.data.deleteFeed.useMutation({
        onSuccess: () => utils.data.feeds.invalidate(),
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Synced Data</h1>
                    <p className="text-muted-foreground">
                        View all data synced from your Komikku app
                    </p>
                </div>

                {/* Stats Overview */}
                <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Categories</CardTitle>
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? (
                                <Skeleton className="h-8 w-12" />
                            ) : (
                                <div className="text-2xl font-bold">{stats?.categories ?? 0}</div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Extension Repos</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? (
                                <Skeleton className="h-8 w-12" />
                            ) : (
                                <div className="text-2xl font-bold">{stats?.extensionRepos ?? 0}</div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Saved Searches</CardTitle>
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? (
                                <Skeleton className="h-8 w-12" />
                            ) : (
                                <div className="text-2xl font-bold">{stats?.savedSearches ?? 0}</div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Feeds</CardTitle>
                            <Rss className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? (
                                <Skeleton className="h-8 w-12" />
                            ) : (
                                <div className="text-2xl font-bold">{stats?.feeds ?? 0}</div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Preferences</CardTitle>
                            <Settings className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? (
                                <Skeleton className="h-8 w-12" />
                            ) : (
                                <div className="text-2xl font-bold">{stats?.preferences ?? 0}</div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Source Prefs</CardTitle>
                            <Database className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {statsLoading ? (
                                <Skeleton className="h-8 w-12" />
                            ) : (
                                <div className="text-2xl font-bold">{stats?.sourcePreferences ?? 0}</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs for different data types */}
                <Tabs defaultValue="categories" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="categories">Categories</TabsTrigger>
                        <TabsTrigger value="repos">Extension Repos</TabsTrigger>
                        <TabsTrigger value="searches">Saved Searches</TabsTrigger>
                        <TabsTrigger value="feeds">Feeds</TabsTrigger>
                        <TabsTrigger value="preferences">Preferences</TabsTrigger>
                    </TabsList>

                    {/* Categories Tab */}
                    <TabsContent value="categories">
                        <Card>
                            <CardHeader>
                                <CardTitle>Categories</CardTitle>
                                <CardDescription>Your library categories synced from Komikku</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {categoriesLoading ? (
                                    <div className="space-y-2">
                                        {[...Array(3)].map((_, i) => (
                                            <Skeleton key={i} className="h-12 w-full" />
                                        ))}
                                    </div>
                                ) : categories?.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">No categories synced yet</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Order</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Flags</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {categories?.map((cat) => (
                                                <TableRow key={cat.id}>
                                                    <TableCell>
                                                        <Badge variant="outline">{cat.order}</Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium">{cat.name}</TableCell>
                                                    <TableCell>
                                                        <code className="text-xs">{cat.flags}</code>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Extension Repos Tab */}
                    <TabsContent value="repos">
                        <Card>
                            <CardHeader>
                                <CardTitle>Extension Repositories</CardTitle>
                                <CardDescription>Custom extension sources synced from Komikku</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {reposLoading ? (
                                    <div className="space-y-2">
                                        {[...Array(3)].map((_, i) => (
                                            <Skeleton key={i} className="h-12 w-full" />
                                        ))}
                                    </div>
                                ) : extensionRepos?.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">No extension repos synced yet</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Short Name</TableHead>
                                                <TableHead>Base URL</TableHead>
                                                <TableHead>Website</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {extensionRepos?.map((repo) => (
                                                <TableRow key={repo.id}>
                                                    <TableCell className="font-medium">{repo.name}</TableCell>
                                                    <TableCell>
                                                        {repo.shortName && <Badge variant="secondary">{repo.shortName}</Badge>}
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate text-xs">
                                                        {repo.baseUrl}
                                                    </TableCell>
                                                    <TableCell>
                                                        {repo.website && (
                                                            <a href={repo.website} target="_blank" rel="noopener noreferrer">
                                                                <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                                            </a>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => deleteRepoMutation.mutate({ id: repo.id })}
                                                            disabled={deleteRepoMutation.isPending}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Saved Searches Tab */}
                    <TabsContent value="searches">
                        <Card>
                            <CardHeader>
                                <CardTitle>Saved Searches</CardTitle>
                                <CardDescription>Your saved search queries synced from Komikku</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {searchesLoading ? (
                                    <div className="space-y-2">
                                        {[...Array(3)].map((_, i) => (
                                            <Skeleton key={i} className="h-12 w-full" />
                                        ))}
                                    </div>
                                ) : savedSearches?.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">No saved searches synced yet</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Name</TableHead>
                                                <TableHead>Source ID</TableHead>
                                                <TableHead>Query</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {savedSearches?.map((search) => (
                                                <TableRow key={search.id}>
                                                    <TableCell className="font-medium">{search.name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{search.source}</Badge>
                                                    </TableCell>
                                                    <TableCell className="max-w-[200px] truncate text-xs">
                                                        {search.query || <span className="text-muted-foreground">-</span>}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => deleteSearchMutation.mutate({ id: search.id })}
                                                            disabled={deleteSearchMutation.isPending}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Feeds Tab */}
                    <TabsContent value="feeds">
                        <Card>
                            <CardHeader>
                                <CardTitle>Feeds</CardTitle>
                                <CardDescription>Your global feeds synced from Komikku</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {feedsLoading ? (
                                    <div className="space-y-2">
                                        {[...Array(3)].map((_, i) => (
                                            <Skeleton key={i} className="h-12 w-full" />
                                        ))}
                                    </div>
                                ) : feeds?.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">No feeds synced yet</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Source ID</TableHead>
                                                <TableHead>Global</TableHead>
                                                <TableHead>Saved Search ID</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {feeds?.map((feed) => (
                                                <TableRow key={feed.id}>
                                                    <TableCell>
                                                        <Badge variant="outline">{feed.source}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={feed.global ? "default" : "secondary"}>
                                                            {feed.global ? "Yes" : "No"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {feed.savedSearchId || <span className="text-muted-foreground">-</span>}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => deleteFeedMutation.mutate({ id: feed.id })}
                                                            disabled={deleteFeedMutation.isPending}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Preferences Tab */}
                    <TabsContent value="preferences">
                        <Card>
                            <CardHeader>
                                <CardTitle>App Preferences</CardTitle>
                                <CardDescription>Your app settings synced from Komikku</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {prefsLoading ? (
                                    <div className="space-y-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Skeleton key={i} className="h-12 w-full" />
                                        ))}
                                    </div>
                                ) : preferences?.length === 0 ? (
                                    <p className="text-muted-foreground text-center py-8">No preferences synced yet</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Key</TableHead>
                                                <TableHead>Value</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {preferences?.map((pref) => (
                                                <TableRow key={pref.id}>
                                                    <TableCell className="font-mono text-sm">{pref.key}</TableCell>
                                                    <TableCell className="max-w-[400px] truncate text-xs">
                                                        <code className="bg-muted px-2 py-1 rounded">
                                                            {JSON.stringify(pref.value)}
                                                        </code>
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
