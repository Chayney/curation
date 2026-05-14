import { useEffect, useState } from "react";
import type { Category, BookmarkArticle, Bookmarks, Articles } from "../../types/article";
import Layout from "../../../../shared/layout/layout";
import styles from "./style.module.css";
import { Input } from "../../../../shared/ui/input";
import { Bookmark, BookOpen, Heart, Loader2 } from "lucide-react";
import { Button } from "../../../../shared/ui/button";
import { supabase } from "../../../../shared/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { NAVIGATION_LIST } from "../../../../shared/const/navigation";
import { useAuthContext } from "../../../auth/hooks/useAuthContext";

export const BookmarkTemplate = () => {
    const navigate = useNavigate();

    // ログインユーザーのIDを取得
    const {
        // ログインユーザーID
        profileId,
        // 認証情報を取得中
        loading,
        // ログイン状態
        isAuth
    } = useAuthContext();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate(NAVIGATION_LIST.LOGIN);
    }

    const [bookmarkArticles, setBookmarkArticles] = useState<BookmarkArticle[]>([]);
    const [bookmarkArticleMap, setBookmarkArticleMap] = useState<Record<number, boolean>>({});

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

    // 記事ごとのお気に入り機能
    // ハートの色切り替えに使用
    // stateが1つだけだと全記事が同じ状態になるため1記事=1状態
    // const [favoriteArticleMap, setFavoriteArticleMap] = useState<Record<number, boolean>>({});

    // カテゴリーごとのお気に入り機能
    // SAVE文字の切り替えに使用
    const [favoriteCategoryMap, setFavoriteCategoryMap] = useState<Record<string, boolean>>({});

    const toggleFavorite = async (articleId: number, categoryId: number) => {
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
            setFavoriteCategoryMap(prev => ({
                ...prev,
                [key]: false
            }));
        } else {
            const { error } = await supabase.from("favorites").insert({
                profile_id: profileId,
                article_id: articleId,
                category_id: categoryId,
            });
            if (error) {
                console.error(error);
                return;
            }
            setFavoriteCategoryMap(prev => ({
                ...prev,
                [key]: true
            }));
            // setFavoriteArticleMap(prev => ({
            //     ...prev,
            //     [articleId]: true
            // }));
        }
    };

    // 今開いているドロップダウン記事ID
    // nullは全て閉じている状態
    const [openArticleId, setOpenArticleId] = useState<number | null>(null);

    // supabaseから取得したカテゴリ一覧
    // ドロップダウンに表示
    const [categories, setCategories] = useState<Category[]>([]);

    // categoriesテーブルからドロップダウンリストを取得
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

        // ハートもしくは画面のどこかをクリックするとドロップダウンを閉じる
        // documentでの監視はやりすぎな感じがするので後ほど変更
        const handleClickOutside = () => {
            setOpenArticleId(null);
        };
        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);

    // ブックマーク記事を取得
    useEffect(() => {
        const fetchBookmarks = async () => {
            if (!profileId) return;
            const { data: bookmarks }: {
                data: Bookmarks[] | null;
            } = await supabase
                .from("bookmarks")
                    .select("id, article_id, profile_id")
                .eq("profile_id", profileId);
            const bookmarkData: Bookmarks[] = bookmarks ?? [];
            const articleIds = bookmarkData.map(f => f.article_id);

            const { data: articles }: {
                data: Articles[] | null
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
                    .in("id", articleIds);
            const articleMap = new Map<number, Articles>();
            articles?.forEach(a => {
                articleMap.set(a.id, a);
            });
            const newMap: Record<number, boolean> = {};
            const merged = bookmarkData.map(item => {
                const key = item.article_id;
                newMap[key] = true;
                return {
                    ...item,
                    articles: articleMap.get(item.article_id) ?? null
                };
            });

            setBookmarkArticleMap(newMap);
            setBookmarkArticles(merged);
        };
        fetchBookmarks();
    }, [profileId]);

    // お気に入り記事を取得
    // useEffect(() => {
    //     const fetchFavorites = async () => {
    //         if (!profileId) return;
    //         const { data, error } = await supabase
    //             .from("favorites")
    //             .select("article_id, category_id")
    //             .eq("profile_id", profileId);
    //         if (error) return;

    //         // 記事単位のお気に入り
    //         const articleMap: Record<number, boolean> = {};
    //         data.forEach((fav) => {
    //             articleMap[fav.article_id] = true;
    //         });
    //         setFavoriteArticleMap(articleMap);

    //         // カテゴリー単位のお気に入り
    //         const categoryMap: Record<string, boolean> = {};
    //         data.forEach((fav) => {
    //             const key = `${fav.article_id}-${fav.category_id}`;
    //             categoryMap[key] = true;
    //         });
    //         setFavoriteCategoryMap(categoryMap);
    //     };
    //     fetchFavorites();
    // }, [profileId]);

    return (
        <div className={styles.wrapper}>
            <Layout />
            <main className={styles.main}>
                <div className={styles.topContainer}>
                    <h2 className={styles.heading}>Feeds</h2>
                    <div className={styles.searchContainer}>
                        <Input
                            type="text"
                            placeholder="Search"
                            inputSize="md"
                        />
                        <Button variant="secondary" onClick={handleLogout}>ログアウト</Button>
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
                            bookmarkArticles.map(article => (
                                <div key={article.id} className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <div className={styles.left}>
                                            <span className={styles.serviceName}>
                                                {
                                                    article.articles?.url &&
                                                    new URL(article.articles.url)
                                                        .hostname
                                                        .split('.')[0]
                                                }
                                            </span>
                                        </div>
                                        <div className={styles.right}>
                                            <a
                                                href={article.articles?.url}
                                                rel="noreferrer"
                                                className={styles.icon}
                                            >
                                                <BookOpen size={30} />
                                            </a>
                                            <Bookmark
                                                size={30}
                                                onClick={() => toggleBookmark(article.article_id)}
                                                className={bookmarkArticleMap[article.article_id] ? styles.bookmarkActive : styles.bookmark}
                                            />
                                            <div className="relative">
                                                <Heart
                                                    size={24}
                                                    onClick={(e) => {
                                                        // document clickを止める
                                                        // この処理でドロップダウンを開いた瞬間すぐ閉じるのを防ぐ
                                                        e.stopPropagation();
                                                        setOpenArticleId((prev) =>
                                                            // 同じ記事のハートをクリックすると閉じ、別記事のハートをクリックするとそのドロップダウンを開く
                                                            prev === article.id ? null : article.id
                                                        );
                                                    }}
                                                    // お気に入り済みであれば赤に変更
                                                    className={article.id ? styles.heartActive : styles.heart}
                                                />
                                                {openArticleId === article.id && (
                                                    <div
                                                        // ドロップダウン内でクリックして閉じないよう制御
                                                        onClick={(e) => e.stopPropagation()}
                                                        className={styles.dropdown}
                                                    >
                                                        {categories.map((category) => (
                                                            <div
                                                                key={category.id}
                                                                className={styles.dropdownItem}
                                                            >
                                                                <span className="truncate flex-1">
                                                                    {category.name}
                                                                </span>

                                                                {/* クリックで記事とカテゴリーの同時保存だがここは後ほど変更 */}
                                                                <Button
                                                                    variant={favoriteCategoryMap[`${article.article_id}-${category.id}`] ? "quaternary" : "tertiary"}
                                                                    onClick={() => toggleFavorite(article.article_id, category.id)}
                                                                >
                                                                    {favoriteCategoryMap[`${article.article_id}-${category.id}`] ? "SAVED" : "SAVE"}
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
                                                src={article.articles?.thumbnail_url}
                                                alt=""
                                                className={styles.avatar}
                                            />
                                        </div>

                                        <div className={styles.contentArea}>
                                            <h3 className={styles.title}>{article.articles?.title}</h3>

                                            <div className={styles.meta}>
                                                <span>🕒 {article.articles?.updated_at
                                                    ? new Date(article.articles.updated_at).toLocaleDateString()
                                                    : "-"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}