import { Link } from "react-router-dom";
import { NAVIGATION_PATH } from "../const/navigation";

export function MobileNav() {
    return (
        <div style={styles.wrapper}>
            <nav style={styles.nav}>
                <Link style={styles.link} to={NAVIGATION_PATH.FEED}>
                    Feeds
                </Link>

                <Link style={styles.link} to={NAVIGATION_PATH.TREND}>
                    Trend
                </Link>

                <Link style={styles.link} to={NAVIGATION_PATH.BOOKMARK}>
                    Bookmarks
                </Link>
            </nav>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    wrapper: {
        width: "100%",
        borderBottom: "1px solid #eee",
        background: "#fff",
    },

    topBar: {
        height: "56px",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        fontWeight: 600,
        fontSize: "16px",
    },

    title: {
        fontWeight: 600,
    },

    nav: {
        display: "flex",
        justifyContent: "space-around",
        padding: "12px 0",
        borderTop: "1px solid #f0f0f0",
    },

    link: {
        textDecoration: "none",
        color: "#333",
        fontSize: "14px",
        fontWeight: 500,
        padding: "6px 10px",
    },
};