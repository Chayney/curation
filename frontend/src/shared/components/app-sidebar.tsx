// アイコン
import {
    Star,
    Newspaper,
    Bookmark,
    Rss,
    Heart,
    ChevronRight
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    useSidebar,
} from "../ui/sidebar";
import { useState } from "react";
import { cn } from "../lib/utils"
import { NAVIGATION_PATH } from "../const/navigation";
import { Link } from "react-router-dom";

const mainItems = [
    { title: "Feeds", url: NAVIGATION_PATH.FEED, icon: Rss },
    { title: "Trend", url: NAVIGATION_PATH.TREND, icon: Star },
    { title: "Bookmarks", url: NAVIGATION_PATH.BOOKMARK, icon: Bookmark }
];

const feedItems = [
    {
        title: "All",
        icon: Newspaper
    },
    {
        title: "Next.js",
        category_id: 1,
        children: [
            {
                title: "Qiita",
                service: "qiita"
            },
            {
                title: "Zenn",
                service: "zenn"
            }
        ]
    },
    {
        title: "React",
        category_id: 2,
        children: [
            {
                title: "Qiita",
                service: "qiita"
            },
            {
                title: "Zenn",
                service: "zenn"
            }
        ]
    },
    {
        title: "TypeScript",
        category_id: 3,
        children: [
            {
                title: "Qiita",
                service: "qiita"
            },
            {
                title: "Zenn",
                service: "zenn"
            }
        ]
    },
    {
        title: "GCP",
        category_id: 4,
        children: [
            {
                title: "Qiita",
                service: "qiita"
            },
            {
                title: "Zenn",
                service: "zenn"
            }
        ]
    },
    {
        title: "AWS",
        category_id: 5,
        children: [
            {
                title: "Qiita",
                service: "qiita"
            },
            {
                title: "Zenn",
                service: "zenn"
            }
        ]
    }
];

const favoriteItems = [
    { title: "Next.js", url: NAVIGATION_PATH.FAVORITE, category_id: 1, icon: Heart },
    { title: "React", url: NAVIGATION_PATH.FAVORITE, category_id: 2, icon: Heart },
    { title: "TypeScript", url: NAVIGATION_PATH.FAVORITE, category_id: 3, icon: Heart },
    { title: "GCP", url: NAVIGATION_PATH.FAVORITE, category_id: 4, icon: Heart },
    { title: "AWS", url: NAVIGATION_PATH.FAVORITE, category_id: 5, icon: Heart },
];

export function AppSidebar() {
    const { state } = useSidebar();
    const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

    const toggle = (key: string) => {
        setOpenMap((prev) => ({
            ...prev,
            [key]: !prev[key],
        }))
    }

    return (
        <Sidebar className="bg-[#0B1120] text-white border-r border-white/10">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Main</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <Link to={`${item.url}`}>
                                        <SidebarMenuButton
                                            isActive={item.title === "Trend"}
                                        >
                                            <item.icon />
                                            {state !== "collapsed" && <span>{item.title}</span>}
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>My Feeds</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenuSub className="ml-0 border-l-0 pl-0">
                            {feedItems.map((item) => {
                                const hasChildren = !!item.children;
                                const isOpen = openMap[item.title];

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        {/* 親 */}
                                        <SidebarMenuButton
                                            onClick={() => hasChildren && toggle(item.title)}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-2">
                                                {item.icon && <item.icon className="h-4 w-4" />}

                                                {hasChildren && (
                                                    <ChevronRight
                                                        className={cn(
                                                            "transition-transform",
                                                            isOpen && "rotate-90"
                                                        )}
                                                    />
                                                )}

                                                <span>{item.title}</span>
                                            </div>
                                        </SidebarMenuButton>

                                        {/* 子 */}
                                        {hasChildren && isOpen && (
                                            <SidebarMenuSub>
                                                {item.children.map((child) => (
                                                    <SidebarMenuItem key={child.title}>
                                                        <SidebarMenuButton asChild>
                                                            <Link
                                                                to={`/tag/${item.category_id}/${child.service}`}
                                                            >
                                                                <span>{child.title}</span>
                                                            </Link>
                                                        </SidebarMenuButton>
                                                    </SidebarMenuItem>
                                                ))}
                                            </SidebarMenuSub>
                                        )}
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenuSub>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>Favorite</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {favoriteItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <Link to={`${item.url}/${item.category_id}`}>
                                        <SidebarMenuButton
                                            isActive={item.title === "Trend"}
                                        >
                                            <item.icon className="text-red-500 fill-red-500" />
                                            {state !== "collapsed" && <span>{item.title}</span>}
                                        </SidebarMenuButton>
                                    </Link>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}