import { SidebarMenuSub } from "../../ui/sidebar";
import { FeedMenuItem } from "./FeedMenuItem";
import { feedItems } from "./menuData";

export const FeedMenu = () => {
    return (
        <SidebarMenuSub className="ml-0 border-l-0 pl-0">
            {feedItems.map((item) => (
                <FeedMenuItem
                    key={item.title}
                    item={item}
                />
            ))}
        </SidebarMenuSub>
    );
};