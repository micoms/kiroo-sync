"use client";

import { DashboardLayout } from "@/components/dashboard/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useSession, signOut } from "@/lib/auth-client";
import { Loader2, LogOut, Settings as SettingsIcon, Shield, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SettingsPage() {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);

    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            await signOut({
                fetchOptions: {
                    onSuccess: () => {
                        router.push("/login");
                    },
                },
            });
        } catch (error) {
            console.error("Failed to sign out", error);
        } finally {
            setIsSigningOut(false);
        }
    };

    if (isPending) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6 max-w-4xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">
                        Manage your account and app preferences
                    </p>
                </div>

                {/* Profile Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Profile
                        </CardTitle>
                        <CardDescription>Your account information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={session?.user?.image || undefined} />
                                <AvatarFallback className="text-lg">
                                    {session?.user?.name?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <h3 className="font-medium text-lg">{session?.user?.name || "User"}</h3>
                                <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
                                <div className="flex items-center gap-2 pt-1">
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                        Active
                                    </span>
                                    {session?.user?.emailVerified && (
                                        <span className="text-xs bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full font-medium">
                                            Verified
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Security
                        </CardTitle>
                        <CardDescription>Manage your session and security settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <h4 className="font-medium">Sign Out</h4>
                                <p className="text-sm text-muted-foreground">
                                    Sign out of your account on this device
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                onClick={handleSignOut}
                                disabled={isSigningOut}
                            >
                                {isSigningOut ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing out...
                                    </>
                                ) : (
                                    <>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sign Out
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* App Settings Placeholder */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <SettingsIcon className="h-5 w-5" />
                            App Preferences
                        </CardTitle>
                        <CardDescription>Customize your dashboard experience</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground italic">
                            Additional preferences coming soon...
                        </p>
                    </CardContent>
                </Card>

                <div className="text-center text-xs text-muted-foreground pt-8">
                    <p>Kiodex Sync Server v0.1.0</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
