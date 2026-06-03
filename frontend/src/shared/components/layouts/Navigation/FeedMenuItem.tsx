import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
} from "../../ui/sidebar";

import { cn } from "../../../lib/utils";

type FeedChild = {
    title: string;
    service: string;
};

type FeedItem = {
    title: string;
    category_id?: number;
    icon?: React.ElementType;
    children?: FeedChild[];
};

type Props = {
    item: FeedItem;
};

export const FeedMenuItem = ({ item }: Props) => {
    const [open, setOpen] = useState(false);
    const hasChildren = !!item.children;

    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                onClick={() => hasChildren && setOpen((prev) => !prev)}
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-2">
                    {item.icon && <item.icon className="h-4 w-4" />}

                    {hasChildren && (
                        <ChevronRight
                            className={cn(
                                "transition-transform",
                                open && "rotate-90"
                            )}
                        />
                    )}

                    <span>{item.title}</span>
                </div>
            </SidebarMenuButton>

            {hasChildren && open && (
                <SidebarMenuSub>
                    {item.children?.map((child) => (
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
};