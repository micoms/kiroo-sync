"use client";

import { Book, History, Key, LayoutDashboard, Archive, Settings, LogOut, Database } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarInset,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Library", href: "/library", icon: Book },
    { name: "Synced Data", href: "/data", icon: Database },
    { name: "Backups", href: "/backups", icon: Archive },
    { name: "Sync History", href: "/history", icon: History },
    { name: "API Keys", href: "/api-keys", icon: Key },
    { name: "Settings", href: "/settings", icon: Settings },
];

function AppSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <Sidebar variant="inset">
            <SidebarHeader>
                <div className="flex items-center gap-2 px-2 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                        <Book className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">Kiroo Sync</h1>
                        <p className="text-xs text-muted-foreground">Manga Synchronization</p>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navigation.map((item) => (
                                <SidebarMenuItem key={item.name}>
                                    <SidebarMenuButton asChild isActive={pathname === item.href}>
                                        <Link href={item.href}>
                                            <item.icon className="h-4 w-4" />
                                            <span>{item.name}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton className="h-auto py-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col items-start">
                                        <span className="text-sm font-medium">
                                            {session?.user?.name || "User"}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {session?.user?.email}
                                        </span>
                                    </div>
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56">
                                <DropdownMenuItem onClick={() => {
                                    signOut().then(() => {
                                        window.location.href = "/login";
                                    });
                                }}>
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                </header>
                <main className="flex-1 overflow-auto p-6">{children}</main>
            </SidebarInset>
        </SidebarProvider>
    );
}
