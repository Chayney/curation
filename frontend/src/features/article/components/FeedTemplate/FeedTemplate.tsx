import { useEffect, useState } from "react";
import type {
    Category,
    Article,
    ArticleTagRow,
    ArticleWithTags
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

export const FeedTemplate = () => {
    const navigate = useNavigate();
    const {
        profileId,
        loading,
        isAuth
    } = useAuthContext();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate(NAVIGATION_LIST.LOGIN)
    };

    // =========================
    // State
    // =========================
    const [articles, setArticles] = useState<ArticleWithTags[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const [keyword, setKeyword] = useState("");

    // bookmark
    const [bookmarkArticleMap, setBookmarkArticleMap] =
        useState<Record<number, boolean>>({});

    // favorite
    const [favoriteArticleMap, setFavoriteArticleMap] =
        useState<Record<number, boolean>>({});

    const [favoriteCategoryMap, setFavoriteCategoryMap] =
        useState<Record<string, boolean>>({});

    // dropdown
    const [openArticleId, setOpenArticleId] =
        useState<number | null>(null);

    // =========================
    // Pagination
    // =========================
    const [currentPage, setCurrentPage] = useState(1);

    const ITEMS_PER_PAGE = 10;

    const startIndex =
        (currentPage - 1) * ITEMS_PER_PAGE;

    const currentArticles = articles.slice(
        startIndex,
        startIndex + ITEMS_PER_PAGE
    );

    const totalPages = Math.ceil(
        articles.length / ITEMS_PER_PAGE
    );

    // =========================
    // Bookmark Toggle
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

            if (error) {
                console.error(error);
                return;
            }

            setBookmarkArticleMap((prev) => ({
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

            if (error) {
                console.error(error);
                return;
            }

            setBookmarkArticleMap((prev) => ({
                ...prev,
                [articleId]: true
            }));
        }
    };

    // =========================
    // Favorite Toggle
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

            if (error) {
                console.error(error);
                return;
            }

            setFavoriteCategoryMap((prev) => ({
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

            if (error) {
                console.error(error);
                return;
            }

            setFavoriteCategoryMap((prev) => ({
                ...prev,
                [key]: true
            }));

            setFavoriteArticleMap((prev) => ({
                ...prev,
                [articleId]: true
            }));
        }
    };

    // =========================
    // Categories Fetch
    // =========================
    useEffect(() => {
        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from("categories")
                .select("id, name");

            if (error) {
                console.error(error);
                return;
            }

            setCategories(data);
        };

        fetchCategories();

        // outside click
        const handleClickOutside = () => {
            setOpenArticleId(null);
        };

        document.addEventListener(
            "click",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "click",
                handleClickOutside
            );
        };
    }, []);

    // =========================
    // Articles Fetch
    // =========================
    useEffect(() => {
        const fetchData = async () => {
            // articles
            const {
                data: articles,
                error: articlesError
            } = await supabase
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
                .ilike("title", `%${keyword}%`);

            if (articlesError) {
                console.error(articlesError);
                return;
            }

            // article_tags + tags
            const {
                data: articleTags,
                error: tagsError
            } = await supabase
                .from("article_tags")
                .select(`
                    article_id,
                    tags (
                        name
                    )
                `);

            if (tagsError) {
                console.error(tagsError);
                return;
            }

            const safeArticles: Article[] =
                articles ?? [];

            const safeTags: ArticleTagRow[] =
                articleTags ?? [];

            // tagMap
            const tagMap =
                new Map<number, string[]>();

            safeTags.forEach((at) => {
                if (!at.tags) return;

                const tagsArray = Array.isArray(at.tags)
                    ? at.tags
                    : [at.tags];

                const names = tagsArray.map(
                    (t) => t.name
                );

                const currentTags =
                    tagMap.get(Number(at.article_id)) ??
                    [];

                const mergedTags = [
                    ...new Set([
                        ...currentTags,
                        ...names
                    ])
                ];

                tagMap.set(
                    Number(at.article_id),
                    mergedTags
                );
            });

            // merge
            const merged: ArticleWithTags[] =
                safeArticles.map((article) => ({
                    ...article,
                    tags:
                        tagMap.get(article.id) ?? []
                }));

            setArticles(merged);
        };

        fetchData();
    }, [keyword]);

    // =========================
    // Fetch Bookmarks
    // =========================
    useEffect(() => {
        const fetchBookmarks = async () => {
            if (!profileId) return;

            const { data, error } = await supabase
                .from("bookmarks")
                .select("article_id")
                .eq("profile_id", profileId);

            if (error) return;

            const articleMap: Record<
                number,
                boolean
            > = {};

            data.forEach((fav) => {
                articleMap[fav.article_id] = true;
            });

            setBookmarkArticleMap(articleMap);
        };

        fetchBookmarks();
    }, [profileId]);

    // =========================
    // Fetch Favorites
    // =========================
    useEffect(() => {
        const fetchFavorites = async () => {
            if (!profileId) return;

            const { data, error } = await supabase
                .from("favorites")
                .select("article_id, category_id")
                .eq("profile_id", profileId);

            if (error) return;

            // article favorite
            const articleMap: Record<
                number,
                boolean
            > = {};

            data.forEach((fav) => {
                articleMap[fav.article_id] = true;
            });

            setFavoriteArticleMap(articleMap);

            // category favorite
            const categoryMap: Record<
                string,
                boolean
            > = {};

            data.forEach((fav) => {
                const key = `${fav.article_id}-${fav.category_id}`;
                categoryMap[key] = true;
            });

            setFavoriteCategoryMap(categoryMap);
        };

        fetchFavorites();
    }, [profileId]);

    return (
        <div className={styles.wrapper}>
            <Layout />

            <main className={styles.main}>
                <div className={styles.topContainer}>
                    <h2 className={styles.heading}>
                        Feeds
                    </h2>

                    {/* Search */}
                    <div className={styles.searchContainer}>
                        <Input
                            type="text"
                            placeholder="Search"
                            inputSize="md"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setKeyword(
                                        e.currentTarget.value
                                    );

                                    // 検索時は1ページ目へ
                                    setCurrentPage(1);
                                }
                            }}
                        />

                        <Button
                            variant="secondary"
                            onClick={handleLogout}
                        >
                            ログアウト
                        </Button>
                    </div>

                    <div className={styles.underContainer}>
                        {loading ? (
                            <div className={styles.loading}>
                                <Loader2
                                    className={
                                        styles.spinner
                                    }
                                />
                            </div>
                        ) : !isAuth ? (
                            <div className={styles.loading}>
                                <span>
                                    ログインしていません
                                </span>
                            </div>
                        ) : (
                            <>
                                {/* Articles */}
                                {currentArticles.map(
                                    (article) => (
                                        <div
                                            key={article.id}
                                            className={
                                                styles.card
                                            }
                                        >
                                            {/* Header */}
                                            <div
                                                className={
                                                    styles.cardHeader
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.left
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            styles.count
                                                        }
                                                    >
                                                        {
                                                            article.likes_count
                                                        }
                                                    </span>

                                                    <span
                                                        className={
                                                            styles.label
                                                        }
                                                    >
                                                        likes
                                                    </span>
                                                </div>

                                                <div
                                                    className={
                                                        styles.right
                                                    }
                                                >
                                                    <a
                                                        href={
                                                            article.url
                                                        }
                                                        rel="noreferrer"
                                                        className={
                                                            styles.icon
                                                        }
                                                    >
                                                        <BookOpen
                                                            size={
                                                                30
                                                            }
                                                        />
                                                    </a>

                                                    {/* Bookmark */}
                                                    <Bookmark
                                                        size={
                                                            30
                                                        }
                                                        onClick={() =>
                                                            toggleBookmark(
                                                                article.id
                                                            )
                                                        }
                                                        className={
                                                            bookmarkArticleMap[
                                                                article
                                                                    .id
                                                            ]
                                                                ? styles.bookmarkActive
                                                                : styles.bookmark
                                                        }
                                                    />

                                                    {/* Favorite */}
                                                    <div className="relative">
                                                        <Heart
                                                            size={
                                                                24
                                                            }
                                                            onClick={(
                                                                e
                                                            ) => {
                                                                e.stopPropagation();

                                                                setOpenArticleId(
                                                                    (
                                                                        prev
                                                                    ) =>
                                                                        prev ===
                                                                            article.id
                                                                            ? null
                                                                            : article.id
                                                                );
                                                            }}
                                                            className={
                                                                favoriteArticleMap[
                                                                    article
                                                                        .id
                                                                ]
                                                                    ? styles.heartActive
                                                                    : styles.heart
                                                            }
                                                        />

                                                        {/* Dropdown */}
                                                        {openArticleId ===
                                                            article.id && (
                                                                <div
                                                                    onClick={(
                                                                        e
                                                                    ) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                    className={
                                                                        styles.dropdown
                                                                    }
                                                                >
                                                                    {categories.map(
                                                                        (
                                                                            category
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    category.id
                                                                                }
                                                                                className={
                                                                                    styles.dropdownItem
                                                                                }
                                                                            >
                                                                                <span className="truncate flex-1">
                                                                                    {
                                                                                        category.name
                                                                                    }
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
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Body */}
                                            <div
                                                className={
                                                    styles.cardBody
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.avatarHeader
                                                    }
                                                >
                                                    <img
                                                        src={
                                                            article.thumbnail_url
                                                        }
                                                        alt=""
                                                        className={
                                                            styles.avatar
                                                        }
                                                    />
                                                </div>

                                                <div
                                                    className={
                                                        styles.contentArea
                                                    }
                                                >
                                                    <h3
                                                        className={
                                                            styles.title
                                                        }
                                                    >
                                                        {
                                                            article.title
                                                        }
                                                    </h3>

                                                    <div
                                                        className={
                                                            styles.meta
                                                        }
                                                    >
                                                        <span>
                                                            🕒{" "}
                                                            {new Date(
                                                                article.updated_at
                                                            ).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    <div
                                                        className={
                                                            styles.tags
                                                        }
                                                    >
                                                        {article.tags.map(
                                                            (
                                                                tag,
                                                                i
                                                            ) => (
                                                                <span
                                                                    key={
                                                                        i
                                                                    }
                                                                    className={
                                                                        styles.tag
                                                                    }
                                                                >
                                                                    {
                                                                        tag
                                                                    }
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                )}

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div
                                        className={
                                            styles.pagination
                                        }
                                    >
                                        {/* Prev */}
                                        <Button
                                            variant="secondary"
                                            disabled={
                                                currentPage ===
                                                1
                                            }
                                            onClick={() =>
                                                setCurrentPage(
                                                    (
                                                        prev
                                                    ) =>
                                                        prev -
                                                        1
                                                )
                                            }
                                        >
                                            Prev
                                        </Button>

                                        {/* Page Number */}
                                        {Array.from(
                                            {
                                                length:
                                                    totalPages
                                            },
                                            (_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() =>
                                                        setCurrentPage(
                                                            i +
                                                            1
                                                        )
                                                    }
                                                    className={
                                                        currentPage ===
                                                            i +
                                                            1
                                                            ? styles.activePage
                                                            : styles.pageButton
                                                    }
                                                >
                                                    {i + 1}
                                                </button>
                                            )
                                        )}

                                        {/* Next */}
                                        <Button
                                            variant="secondary"
                                            disabled={
                                                currentPage ===
                                                totalPages
                                            }
                                            onClick={() =>
                                                setCurrentPage(
                                                    (
                                                        prev
                                                    ) =>
                                                        prev +
                                                        1
                                                )
                                            }
                                        >
                                            Next
                                        </Button>
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