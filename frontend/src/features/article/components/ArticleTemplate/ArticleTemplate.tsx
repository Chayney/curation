import { useEffect, useState } from "react";
import type { Category, Article } from "../../types/article";
import Layout from "../../../../shared/layout/layout";
import styles from "./style.module.css";
import { Input } from "../../../../shared/ui/input";
import { Bookmark, BookOpen, Heart, Home, Loader2 } from "lucide-react";
import { Button } from "../../../../shared/ui/button";
import { supabase } from "../../../../shared/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { NAVIGATION_LIST } from "../../../../shared/const/navigation";
import type { PostgrestError } from "@supabase/supabase-js";
import { useAuthContext } from "../../../auth/hooks/useAuthContext";

export const ArticleTemplate = () => {
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

    const [articles, setArticles] = useState<Article[]>([]);
    // 記事ごとのお気に入り機能
    // ハートの色切り替えに使用
    // stateが1つだけだと全記事が同じ状態になるため1記事=1状態
    const [favoriteArticleMap, setFavoriteArticleMap] = useState<Record<number, boolean>>({});

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
            setFavoriteArticleMap(prev => ({
                ...prev,
                [articleId]: true
            }));
        } 
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate(NAVIGATION_LIST.LOGIN);
    }

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

    // バッチ処理でDBに記事を保存する形を取る
    useEffect(() => {
        const fetchData = async () => {
            const { data, error }: {
                data: Article[] | null;
                error: PostgrestError | null;
            } = await supabase
                .from("articles")
                .select(`
                    id,
                    title,
                    url,
                    likes_count,
                    created_at,
                    updated_at,
                    article_tags (
                        tags (
                            name
                        )
                    )
                `);
            if (error) {
                console.error(error);
                return;
            }   
            setArticles(data ?? []);
        }
        fetchData();
    }, []);

    // お気に入り記事を取得
    useEffect(() => {
        const fetchFavorites = async () => {
            if (!profileId) return;
            const { data, error } = await supabase
                .from("favorites")
                .select("article_id, category_id")
                .eq("profile_id", profileId);
            if (error) return;

            // 記事単位のお気に入り
            const articleMap: Record<number, boolean> = {};
            data.forEach((fav) => {
                articleMap[fav.article_id] = true;
            });
            setFavoriteArticleMap(articleMap);

            // カテゴリー単位のお気に入り
            const categoryMap: Record<string, boolean> = {};
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
                    <h2 className={styles.heading}>Qiita Articles</h2>
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
                            articles.map(article => (
                                <div key={article.id} className={styles.card}>
                                    <div className={styles.cardHeader}>
                                        <div className={styles.left}>
                                            <Home size={30} />
                                            <span>テスト</span>
                                        </div>
                                        <div className={styles.right}>
                                            <a
                                                href={article.url}
                                                rel="noreferrer"
                                                className={styles.icon}
                                            >
                                                <BookOpen size={30} />
                                            </a>
                                            <a
                                                href="/share"
                                                rel="noreferrer"
                                                className={styles.icon}
                                            >
                                                <Bookmark size={30} />
                                            </a>
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
                                                    className={favoriteArticleMap[article.id] ? styles.active : ""}
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
                                                                <Button variant={favoriteCategoryMap[`${article.id}-${category.id}`] ? "quaternary" : "tertiary"} onClick={() => toggleFavorite(article.id, category.id)}>
                                                                    {favoriteCategoryMap[`${article.id}-${category.id}`] ? "SAVED" : "SAVE"}
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
                                                src={`https://picsum.photos/800/600`}
                                                alt=""
                                                className={styles.avatar}
                                            />
                                        </div>

                                        <div className={styles.contentArea}>
                                            <h3 className={styles.title}>{article.title}</h3>

                                            <div className={styles.meta}>
                                                <span>🕒 {new Date(article.updated_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className={styles.tags}>
                                                {article.article_tags
                                                    .filter((item) => item.tags)
                                                    .map((item, i) => (
                                                        <span key={i} className={styles.tag}>
                                                            {item.tags!.name}
                                                        </span>
                                                    ))}
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