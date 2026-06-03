import { Link } from "react-router-dom"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../../ui/sidebar"
import { mainItems } from "./menuData"

type Props = {
    collapsed: boolean
}

export const MainMenu = ({ collapsed }: Props) => {
    return (
        <SidebarMenu>
            {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                    <Link to={item.url}>
                        <SidebarMenuButton>
                            <item.icon />
                            {!collapsed && <span>{item.title}</span>}
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    )
}