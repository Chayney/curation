import { SidebarProvider } from "../ui/sidebar"
import { AppSidebar } from "../components/app-sidebar"
import { TooltipProvider } from "../ui/tooltip"

export default function Layout() {
    return (
        <TooltipProvider>
            <SidebarProvider defaultOpen={true}>
                <AppSidebar />
            </SidebarProvider>
        </TooltipProvider>
    )
}