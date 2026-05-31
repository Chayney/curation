import { SidebarProvider } from "../ui/sidebar";
import { AppSidebar } from "../components/app-sidebar";
import { TooltipProvider } from "../ui/tooltip";
import { useIsMobile } from "../../hooks/use-mobile";
import { MobileNav } from "../components/mobile-navigation";

export default function Layout() {
    const isMobile = useIsMobile();

    return (
        <TooltipProvider>
            {!isMobile ? (
                <SidebarProvider defaultOpen={true}>
                    <div>
                        <AppSidebar />
                        <main>{/* content */}</main>
                    </div>
                </SidebarProvider>
            ) : (
                <div>
                    <MobileNav />
                    <main>{/* content */}</main>
                </div>
            )}
        </TooltipProvider>
    );
}