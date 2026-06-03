import styles from "./style.module.css";
import { BookOpen, Bookmark, Heart } from "lucide-react";
import { Button } from "../../../../shared/components/ui/button";
import type { ArticleWithTags, Category } from "../../types/article";

type Props = {
    article: ArticleWithTags;
    categories: Category[];
    bookmarkMap: Record<number, boolean>;
    favoriteArticleMap: Record<number, boolean>;
    favoriteCategoryMap: Record<string, boolean>;
    tooltip: {
        articleId: number;
        message: string;
    } | null;
    openArticleId: number | null;

    toggleBookmark: (articleId: number) => void;
    toggleFavorite: (articleId: number, categoryId: number) => void;
    toggleDropdown: (categoryId: number) => void;
    showTooltip: (articleId: number, message: string) => void;
    setOpenArticleId: React.Dispatch<React.SetStateAction<number | null>>;
};

export const ArticleCard = ({
    article,
    categories,

    bookmarkMap,
    favoriteArticleMap,
    favoriteCategoryMap,

    tooltip,
    openArticleId,

    toggleBookmark,
    toggleFavorite,
    toggleDropdown,
    showTooltip,
}: Props) => {
    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <div className={styles.left}>
                    <span className={styles.count}>
                        {article.likes_count}
                    </span>
                    <span className={styles.label}>likes</span>
                </div>

                <div className={styles.right}>
                    <a
                        href={article.url}
                        rel="noreferrer"
                        className={styles.icon}
                    >
                        <BookOpen size={30} />
                    </a>

                    {/* Bookmark */}
                    <Bookmark
                        size={30}
                        onClick={() => toggleBookmark(article.id)}
                        className={
                            bookmarkMap[article.id]
                                ? styles.bookmarkActive
                                : styles.bookmark
                        }
                    />

                    {/* Favorite */}
                    <div className="relative">
                        <Heart
                            size={24}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleDropdown(article.id);
                            }}
                            className={
                                favoriteArticleMap[article.id]
                                    ? styles.heartActive
                                    : styles.heart
                            }
                        />

                        {/* Tooltip */}
                        {tooltip?.articleId === article.id && (
                            <div className={styles.tooltip}>
                                {tooltip.message}
                            </div>
                        )}

                        {/* Dropdown */}
                        {openArticleId === article.id && (
                            <div
                                data-dropdown={article.id}
                                onClick={(e) => e.stopPropagation()}
                                className={styles.dropdown}
                            >
                                {categories.map((category) => {
                                    const key = `${article.id}-${category.id}`;

                                    return (
                                        <div
                                            key={category.id}
                                            className={styles.dropdownItem}
                                        >
                                            <span className="truncate flex-1">
                                                {category.name}
                                            </span>

                                            <Button
                                                variant={
                                                    favoriteCategoryMap[key]
                                                        ? "quaternary"
                                                        : "tertiary"
                                                }
                                                onClick={() => {
                                                    const isSaved =
                                                        favoriteCategoryMap[key];

                                                    toggleFavorite(
                                                        article.id,
                                                        category.id
                                                    );

                                                    showTooltip(
                                                        article.id,
                                                        isSaved
                                                            ? "Delete Favorite"
                                                            : "Add Favorite"
                                                    );
                                                }}
                                            >
                                                {favoriteCategoryMap[key]
                                                    ? "SAVED"
                                                    : "SAVE"}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className={styles.cardBody}>
                <div className={styles.avatarHeader}>
                    <img
                        src={article.thumbnail_url}
                        alt=""
                        className={styles.avatar}
                    />
                </div>

                <div className={styles.contentArea}>
                    <h3 className={styles.title}>
                        {article.title}
                    </h3>

                    <div className={styles.meta}>
                        <span>
                            🕒{" "}
                            {new Date(
                                article.updated_at
                            ).toLocaleDateString()}
                        </span>
                    </div>

                    <div className={styles.tags}>
                        {article.tags.map((tag, i) => (
                            <span key={i} className={styles.tag}>
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};