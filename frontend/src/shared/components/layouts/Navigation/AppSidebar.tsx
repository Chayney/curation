// sidebarコンポーネントの色設定はtailwind.config.js

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, useSidebar } from "../../ui/sidebar";
import { MainMenu } from "./MainMenu";
import { FeedMenu } from "./FeedMenu";
import { FavoriteMenu } from "./FavoriteMenu";

export function AppSidebar() {
    const { state } = useSidebar();

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Main</SidebarGroupLabel>
                    <SidebarGroupContent>
                        {/* expandedはアイコンのみ、collapsedはアイコン+テキスト */}
                        <MainMenu collapsed={state === "collapsed"} />
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>My Feeds</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <FeedMenu />
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel>Favorite</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <FavoriteMenu collapsed={state === "collapsed"} />
                    </SidebarGroupContent>
                </SidebarGroup>

            </SidebarContent>
        </Sidebar>
    );
}