import { Link } from "react-router-dom";
import { NAVIGATION_PATH } from "../../../../const/navigation";
import { useRef, useState } from "react";
import { favoriteItems } from "../menuData";
import styles from "./style.module.css";

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

    return (
        <div className={styles.wrapper}>
            {/* 横スクロールはここだけ */}
            <div className={styles.scroll}>
                <nav className={styles.nav}>
                    <Link className={styles.link} to={NAVIGATION_PATH.FEED}>Feeds</Link>
                    <Link className={styles.link} to={NAVIGATION_PATH.TREND}>Trend</Link>
                    <Link className={styles.link} to={NAVIGATION_PATH.BOOKMARK}>Bookmarks</Link>

                    <button
                        ref={btnRef}
                        className={styles.link}
                        onClick={toggle}
                    >
                        Favorites ▼
                    </button>
                </nav>
            </div>

            {/* dropdownは独立 */}
            {open && (
                <div
                    className={styles.dropdown}
                    style={{ top: pos.top, left: pos.left }}
                >
                    {favoriteItems.map(item => (
                        <Link
                            key={item.category_id}
                            to={`${item.url}/${item.category_id}`}
                            className={styles.item}
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