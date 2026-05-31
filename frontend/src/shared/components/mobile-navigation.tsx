import { Link } from "react-router-dom";
import { NAVIGATION_PATH } from "../const/navigation";
import { useRef, useState } from "react";

const favoriteItems = [
    { title: "Next.js", url: NAVIGATION_PATH.FAVORITE, category_id: 1 },
    { title: "React", url: NAVIGATION_PATH.FAVORITE, category_id: 2 },
    { title: "TypeScript", url: NAVIGATION_PATH.FAVORITE, category_id: 3 },
    { title: "GCP", url: NAVIGATION_PATH.FAVORITE, category_id: 4 },
    { title: "AWS", url: NAVIGATION_PATH.FAVORITE, category_id: 5 },
];

export function MobileNav() {
    const [open, setOpen] = useState(false);
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const [pos, setPos] = useState({ top: 0, left: 0 });

    const toggle = () => {
        if (!open && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();

            setPos({
                top: rect.bottom,
                left: rect.left,
            });
        }
        setOpen(v => !v);
    };

    const styles: Record<string, React.CSSProperties> = {
        wrapper: {
            width: "100%",
            position: "relative",
            background: "#000",
        },

        scroll: {
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
        },

        nav: {
            display: "flex",
            flexWrap: "nowrap",
            width: "max-content",
            gap: "12px",
            padding: "12px 10px",
        },

        link: {
            flex: "0 0 auto",
            color: "#fff",
            padding: "6px 10px",
            whiteSpace: "nowrap",
            textDecoration: "none",
            background: "transparent",
            border: "none",
            cursor: "pointer",
        },

        dropdown: {
            position: "fixed", // ★完全分離（overflow影響ゼロ）
            background: "#111",
            borderRadius: "8px",
            padding: "8px 0",
            minWidth: "160px",
            zIndex: 99999,
        },

        item: {
            display: "block",
            padding: "8px 12px",
            color: "#fff",
            textDecoration: "none",
            fontSize: "13px",
        },
    };

    return (
        <div style={styles.wrapper}>
            {/* 横スクロールはここだけ */}
            <div style={styles.scroll}>
                <nav style={styles.nav}>
                    <Link style={styles.link} to={NAVIGATION_PATH.FEED}>Feeds</Link>
                    <Link style={styles.link} to={NAVIGATION_PATH.TREND}>Trend</Link>
                    <Link style={styles.link} to={NAVIGATION_PATH.BOOKMARK}>Bookmarks</Link>

                    <button
                        ref={btnRef}
                        style={styles.link}
                        onClick={toggle}
                    >
                        Favorites ▼
                    </button>
                </nav>
            </div>

            {/* dropdownは完全独立（これが正解） */}
            {open && (
                <div style={{ ...styles.dropdown, top: pos.top, left: pos.left }}>
                    {favoriteItems.map(item => (
                        <Link
                            key={item.category_id}
                            to={`${item.url}/${item.category_id}`}
                            style={styles.item}
                            onClick={() => setOpen(false)}
                        >
                            {item.title}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}