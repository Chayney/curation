import { useEffect, useState } from "react";
import type {
    Category,
    Article,
    ArticleWithTags,
    ArticleTagRow
} from "../../types/article";

import Layout from "../../../../shared/layout/layout";
import styles from "./style.module.css";
import { Input } from "../../../../shared/ui/input";
import { Bookmark, BookOpen, Heart, Loader2 } from "lucide-react";
import { Button } from "../../../../shared/ui/button";
import { supabase } from "../../../../shared/lib/supabaseClient";
import { useAuthContext } from "../../../auth/hooks/useAuthContext";
import { useNavigate } from "react-router-dom";
import { NAVIGATION_LIST } from "../../../../shared/const/navigation";

export const TrendTemplate = () => {
    const navigate = useNavigate();
    const {
        profileId,
        loading,
        isAuth
    } = useAuthContext();

    const [articles, setArticles] = useState<ArticleWithTags[]>([]);
    const [bookmarkArticleMap, setBookmarkArticleMap] =
        useState<Record<number, boolean>>({});

    const [favoriteArticleMap, setFavoriteArticleMap] =
        useState<Record<number, boolean>>({});

    const [favoriteCategoryMap, setFavoriteCategoryMap] =
        useState<Record<string, boolean>>({});

    const [openArticleId, setOpenArticleId] =
        useState<number | null>(null);

    const [categories, setCategories] = useState<Category[]>([]);
    const [keyword, setKeyword] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    const currentArticles = articles.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
    );

    const totalPages = Math.ceil(
        articles.length / ITEMS_PER_PAGE
    );

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate(NAVIGATION_LIST.LOGIN);
    };

    // =========================
    // Bookmark
    // =========================
    const toggleBookmark = async (articleId: number) => {
        if (!profileId) return;

        const isBookmark = bookmarkArticleMap[articleId];

        if (isBookmark) {
            const { error } = await supabase
                .from("bookmarks")
                .delete()
                .eq("profile_id", profileId)
                .eq("article_id", articleId);

            if (error) return;

            setBookmarkArticleMap(prev => ({
                ...prev,
                [articleId]: false
            }));
        } else {
            const { error } = await supabase
                .from("bookmarks")
                .insert({
                    profile_id: profileId,
                    article_id: articleId
                });

            if (error) return;

            setBookmarkArticleMap(prev => ({
                ...prev,
                [articleId]: true
            }));
        }
    };

    // =========================
    // Favorite
    // =========================
    const toggleFavorite = async (
        articleId: number,
        categoryId: number
    ) => {
        if (!profileId) return;

        const key = `${articleId}-${categoryId}`;
        const isFavorite = favoriteCategoryMap[key];

        if (isFavorite) {
            const { error } = await supabase
                .from("favorites")
                .delete()
                .eq("profile_id", profileId)
                .eq("article_id", articleId)
                .eq("category_id", categoryId);

            if (error) return;

            setFavoriteCategoryMap(prev => ({
                ...prev,
                [key]: false
            }));
        } else {
            const { error } = await supabase
                .from("favorites")
                .insert({
                    profile_id: profileId,
                    article_id: articleId,
                    category_id: categoryId
                });

            if (error) return;

            setFavoriteCategoryMap(prev => ({
                ...prev,
                [key]: true
            }));

            setFavoriteArticleMap(prev => ({
                ...prev,
                [articleId]: true
            }));
        }
    };

    // =========================
    // Categories fetch
    // =========================
    useEffect(() => {
        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from("categories")
                .select("id, name");

            if (error) return;

            setCategories(data ?? []);
        };

        fetchCategories();

        const handleClickOutside = () => {
            setOpenArticleId(null);
        };

        document.addEventListener("click", handleClickOutside);

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    // =========================
    // Articles fetch
    // =========================
    useEffect(() => {
        const fetchData = async () => {
            const { data: articles, error: articlesError } =
                await supabase
                    .from("articles")
                    .select(`
                        id,
                        title,
                        url,
                        thumbnail_url,
                        likes_count,
                        created_at,
                        updated_at
                    `)
                    .order("likes_count", { ascending: false })
                    .ilike("title", `%${keyword}%`);

            if (articlesError) return;

            const { data: articleTags, error: tagsError } =
                await supabase
                    .from("article_tags")
                    .select(`
                        article_id,
                        tags (
                            name
                        )
                    `);

            if (tagsError) return;

            const safeArticles: Article[] = articles ?? [];
            const safeTags: ArticleTagRow[] = articleTags ?? [];

            const tagMap = new Map<number, string[]>();

            safeTags.forEach(at => {
                if (!at.tags) return;

                const tagsArray = Array.isArray(at.tags)
                    ? at.tags
                    : [at.tags];

                const names = tagsArray.map(t => t.name);

                const current = tagMap.get(Number(at.article_id)) ?? [];

                tagMap.set(
                    Number(at.article_id),
                    [...new Set([...current, ...names])]
                );
            });

            const merged: ArticleWithTags[] = safeArticles.map(a => ({
                ...a,
                tags: tagMap.get(a.id) ?? []
            }));

            setArticles(merged);

            // 🔥 検索時は1ページ目へ
            setCurrentPage(1);
        };

        fetchData();
    }, [keyword]);

    // =========================
    // Bookmarks fetch
    // =========================
    useEffect(() => {
        const fetchBookmarks = async () => {
            if (!profileId) return;

            const { data } = await supabase
                .from("bookmarks")
                .select("article_id")
                .eq("profile_id", profileId);

            if (!data) return;

            const map: Record<number, boolean> = {};
            data.forEach(d => {
                map[d.article_id] = true;
            });

            setBookmarkArticleMap(map);
        };

        fetchBookmarks();
    }, [profileId]);

    // =========================
    // Favorites fetch
    // =========================
    useEffect(() => {
        const fetchFavorites = async () => {
            if (!profileId) return;

            const { data } = await supabase
                .from("favorites")
                .select("article_id, category_id")
                .eq("profile_id", profileId);

            if (!data) return;

            const articleMap: Record<number, boolean> = {};
            const categoryMap: Record<string, boolean> = {};

            data.forEach(f => {
                articleMap[f.article_id] = true;
                categoryMap[`${f.article_id}-${f.category_id}`] = true;
            });

            setFavoriteArticleMap(articleMap);
            setFavoriteCategoryMap(categoryMap);
        };

        fetchFavorites();
    }, [profileId]);

    // =========================
    // UI
    // =========================
    return (
        <div className={styles.wrapper}>
            <Layout />

            <main className={styles.main}>
                <div className={styles.topContainer}>
                    <h2 className={styles.heading}>Trend</h2>

                    <div className={styles.searchContainer}>
                        <Input
                            type="text"
                            placeholder="Search"
                            inputSize="md"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setKeyword(e.currentTarget.value);
                                    setCurrentPage(1);
                                }
                            }}
                        />

                        <Button variant="secondary" onClick={handleLogout}>
                            ログアウト
                        </Button>
                    </div>

                    <div className={styles.underContainer}>
                        {loading ? (
                            <div className={styles.loading}>
                                <Loader2 className={styles.spinner} />
                            </div>
                        ) : !isAuth ? (
                            <div className={styles.loading}>
                                <span>ログインしていません</span>
                            </div>
                        ) : (
                            <>
                                {/* =========================
                                    Articles（ページング適用）
                                ========================= */}
                                {currentArticles.map(article => (
                                    <div key={article.id} className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <div className={styles.left}>
                                                <span className={styles.count}>
                                                    {article.likes_count}
                                                </span>
                                                <span className={styles.label}>
                                                    likes
                                                </span>
                                            </div>

                                            <div className={styles.right}>
                                                <a
                                                    href={article.url}
                                                    rel="noreferrer"
                                                    className={styles.icon}
                                                >
                                                    <BookOpen size={30} />
                                                </a>

                                                <Bookmark
                                                    size={30}
                                                    onClick={() => toggleBookmark(article.id)}
                                                    className={
                                                        bookmarkArticleMap[article.id]
                                                            ? styles.bookmarkActive
                                                            : styles.bookmark
                                                    }
                                                />

                                                <div className="relative">
                                                    <Heart
                                                        size={24}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setOpenArticleId(prev =>
                                                                prev === article.id ? null : article.id
                                                            );
                                                        }}
                                                        className={
                                                            favoriteArticleMap[article.id]
                                                                ? styles.active
                                                                : ""
                                                        }
                                                    />

                                                    {openArticleId === article.id && (
                                                        <div
                                                            onClick={(e) => e.stopPropagation()}
                                                            className={styles.dropdown}
                                                        >
                                                            {categories.map(category => (
                                                                <div
                                                                    key={category.id}
                                                                    className={styles.dropdownItem}
                                                                >
                                                                    <span className="truncate flex-1">
                                                                        {category.name}
                                                                    </span>

                                                                    <Button
                                                                        variant={
                                                                            favoriteCategoryMap[
                                                                                `${article.id}-${category.id}`
                                                                            ]
                                                                                ? "quaternary"
                                                                                : "tertiary"
                                                                        }
                                                                        onClick={() =>
                                                                            toggleFavorite(
                                                                                article.id,
                                                                                category.id
                                                                            )
                                                                        }
                                                                    >
                                                                        {favoriteCategoryMap[
                                                                            `${article.id}-${category.id}`
                                                                        ]
                                                                            ? "SAVED"
                                                                            : "SAVE"}
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.cardBody}>
                                            <div className={styles.avatarHeader}>
                                                <img
                                                    src={article.thumbnail_url}
                                                    className={styles.avatar}
                                                />
                                            </div>

                                            <div className={styles.contentArea}>
                                                <h3 className={styles.title}>
                                                    {article.title}
                                                </h3>

                                                <div className={styles.meta}>
                                                    🕒{" "}
                                                    {new Date(article.updated_at).toLocaleDateString()}
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
                                ))}

                                {/* =========================
                                    Pagination
                                ========================= */}
                                {totalPages > 1 && (
                                    <div className={styles.pagination}>
                                        <button
                                            className={styles.pageButton}
                                            disabled={currentPage === 1}
                                            onClick={() =>
                                                setCurrentPage(prev => prev - 1)
                                            }
                                        >
                                            Prev
                                        </button>

                                        {Array.from(
                                            { length: totalPages },
                                            (_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setCurrentPage(i + 1)}
                                                    className={
                                                        currentPage === i + 1
                                                            ? styles.activePage
                                                            : styles.pageButton
                                                    }
                                                >
                                                    {i + 1}
                                                </button>
                                            )
                                        )}

                                        <button
                                            className={styles.pageButton}
                                            disabled={currentPage === totalPages}
                                            onClick={() =>
                                                setCurrentPage(prev => prev + 1)
                                            }
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};