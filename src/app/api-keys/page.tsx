"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Key, Plus, Trash2, Copy, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function ApiKeysPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [keyName, setKeyName] = useState("");
    const [deviceName, setDeviceName] = useState("");
    const [newKey, setNewKey] = useState<string | null>(null);

    const utils = trpc.useUtils();
    const { data: keys, isLoading } = trpc.apiKeys.list.useQuery();

    const createMutation = trpc.apiKeys.create.useMutation({
        onSuccess: (data) => {
            setNewKey(data.key);
            setKeyName("");
            setDeviceName("");
            utils.apiKeys.list.invalidate();
        },
        onError: (error) => {
            toast.error("Failed to create API key: " + error.message);
        },
    });

    const revokeMutation = trpc.apiKeys.revoke.useMutation({
        onSuccess: () => {
            toast.success("API key revoked");
            utils.apiKeys.list.invalidate();
        },
        onError: (error) => {
            toast.error("Failed to revoke API key: " + error.message);
        },
    });

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    const handleCloseDialog = () => {
        setIsCreateOpen(false);
        setNewKey(null);
        setKeyName("");
        setDeviceName("");
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
                        <p className="text-muted-foreground">
                            Manage API keys for syncing from your devices
                        </p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Generate Key
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            {newKey ? (
                                <>
                                    <DialogHeader>
                                        <DialogTitle>API Key Generated</DialogTitle>
                                        <DialogDescription>
                                            This is the only time you will see this key. Make sure to save it securely.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                                            <code className="flex-1 text-sm break-all font-mono">{newKey}</code>
                                            <Button variant="outline" size="icon" onClick={() => copyToClipboard(newKey)}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                            <div className="text-sm">
                                                <p className="font-medium text-yellow-500">Save this key now!</p>
                                                <p className="text-muted-foreground">
                                                    You won&apos;t be able to see it again after closing this dialog.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={handleCloseDialog}>Done</Button>
                                    </DialogFooter>
                                </>
                            ) : (
                                <>
                                    <DialogHeader>
                                        <DialogTitle>Generate API Key</DialogTitle>
                                        <DialogDescription>
                                            Create a new API key for syncing from your Tachiyomi/Mihon app.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Key Name</Label>
                                            <Input
                                                id="name"
                                                placeholder="e.g., My Phone"
                                                value={keyName}
                                                onChange={(e) => setKeyName(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="device">Device Name (optional)</Label>
                                            <Input
                                                id="device"
                                                placeholder="e.g., Samsung Galaxy S24"
                                                value={deviceName}
                                                onChange={(e) => setDeviceName(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={handleCloseDialog}>
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={() => createMutation.mutate({ name: keyName, deviceName: deviceName || undefined })}
                                            disabled={!keyName || createMutation.isPending}
                                        >
                                            {createMutation.isPending ? "Generating..." : "Generate Key"}
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle>How to use API Keys</CardTitle>
                        <CardDescription>Follow these steps to sync your manga app</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex gap-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">1</div>
                            <p>Generate a new API key above and copy it</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">2</div>
                            <p>In your Tachiyomi/Mihon app, go to Settings → Data & sync → Sync service</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">3</div>
                            <p>Enter your server URL and paste the API key</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">4</div>
                            <p>Use the same API key on all your devices to sync between them</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Keys List */}
                {isLoading ? (
                    <div className="space-y-4">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-6">
                                    <Skeleton className="h-6 w-32 mb-2" />
                                    <Skeleton className="h-4 w-48" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : !keys || keys.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Key className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold">No API keys yet</h3>
                            <p className="text-muted-foreground text-center max-w-md mt-2">
                                Generate an API key to start syncing your manga library from your devices.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {keys.map((key) => (
                            <Card key={key.id}>
                                <CardContent className="flex items-center justify-between p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Key className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{key.name}</h3>
                                            {key.deviceName && (
                                                <p className="text-sm text-muted-foreground">{key.deviceName}</p>
                                            )}
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {key.lastUsedAt
                                                    ? `Last used ${formatDistanceToNow(key.lastUsedAt, { addSuffix: true })}`
                                                    : "Never used"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">
                                            Created {formatDistanceToNow(key.createdAt, { addSuffix: true })}
                                        </Badge>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => revokeMutation.mutate({ id: key.id })}
                                            disabled={revokeMutation.isPending}
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
