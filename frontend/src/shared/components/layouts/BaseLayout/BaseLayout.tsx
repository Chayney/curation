import { SidebarProvider } from "../../ui/sidebar";
import { AppSidebar } from "../Navigation/AppSidebar";
import { TooltipProvider } from "../../ui/tooltip";
import { useIsMobile } from "./useMobile";
import { MobileNav } from "../Navigation/MobileNavigation/MobileNavigation";
import styles from "./style.module.css";

type Props = {
    children: React.ReactNode;
    header?: React.ReactNode;
};

export default function Layout({ children, header }: Props) {
    const isMobile = useIsMobile();

    return (
        <TooltipProvider>
            {!isMobile ? (
                <SidebarProvider defaultOpen={true}>
                    <div className={styles.layout}>
                        <AppSidebar />

                        <div className={styles.main}>
                            {header}
                            {children}
                        </div>
                    </div>
                </SidebarProvider>
            ) : (
                <div className={styles.mobileLayout}>
                    <MobileNav />
                    <main>
                        {header}
                        {children}
                    </main>
                </div>
            )}
        </TooltipProvider>
    );
}