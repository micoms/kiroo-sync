"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Archive, Download, Plus, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export default function BackupsPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [backupName, setBackupName] = useState("");
    const [backupDescription, setBackupDescription] = useState("");

    const utils = trpc.useUtils();
    const { data: backups, isLoading } = trpc.backup.list.useQuery({ limit: 20 });

    const createMutation = trpc.backup.create.useMutation({
        onSuccess: () => {
            toast.success("Backup created successfully!");
            setIsCreateOpen(false);
            setBackupName("");
            setBackupDescription("");
            utils.backup.list.invalidate();
        },
        onError: (error) => {
            toast.error("Failed to create backup: " + error.message);
        },
    });

    const deleteMutation = trpc.backup.delete.useMutation({
        onSuccess: () => {
            toast.success("Backup deleted");
            utils.backup.list.invalidate();
        },
        onError: (error) => {
            toast.error("Failed to delete backup: " + error.message);
        },
    });

    const downloadMutation = trpc.backup.download.useMutation({
        onSuccess: (data) => {
            const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = data.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Backup downloaded!");
        },
        onError: (error) => {
            toast.error("Failed to download backup: " + error.message);
        },
    });

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Backups</h1>
                        <p className="text-muted-foreground">
                            Create and manage backup snapshots of your library
                        </p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Backup
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create Backup</DialogTitle>
                                <DialogDescription>
                                    Create a snapshot of your current manga library and reading progress.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Backup Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Pre-update backup"
                                        value={backupName}
                                        onChange={(e) => setBackupName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description (optional)</Label>
                                    <Input
                                        id="description"
                                        placeholder="e.g., Backup before migrating sources"
                                        value={backupDescription}
                                        onChange={(e) => setBackupDescription(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => createMutation.mutate({ name: backupName, description: backupDescription })}
                                    disabled={!backupName || createMutation.isPending}
                                >
                                    {createMutation.isPending ? "Creating..." : "Create Backup"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Backups List */}
                {isLoading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-6">
                                    <Skeleton className="h-6 w-48 mb-2" />
                                    <Skeleton className="h-4 w-32" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : !backups || backups.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Archive className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No backups yet</h3>
                            <p className="text-muted-foreground text-center max-w-md mt-2">
                                Create a backup to save a snapshot of your manga library and reading progress.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {backups.map((backup) => (
                            <Card key={backup.id}>
                                <CardContent className="flex items-center justify-between p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Archive className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{backup.name}</h3>
                                            {backup.description && (
                                                <p className="text-sm text-muted-foreground">{backup.description}</p>
                                            )}
                                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                                <span>{backup.mangaCount} manga</span>
                                                <span>•</span>
                                                <span>{backup.chapterCount} chapters</span>
                                                <span>•</span>
                                                <span>{formatBytes(backup.sizeBytes ?? 0)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">
                                            {formatDistanceToNow(backup.createdAt, { addSuffix: true })}
                                        </Badge>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => downloadMutation.mutate({ id: backup.id })}
                                            disabled={downloadMutation.isPending}
                                        >
                                            <Download className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => deleteMutation.mutate({ id: backup.id })}
                                            disabled={deleteMutation.isPending}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
