import { useEffect, useState } from "react";
import type { Articles, ArticleTags, Category, TagArticleWithRelations, Tags } from "../../types/article";
import Layout from "../../../../shared/layout/layout";
import styles from "./style.module.css";
import { Input } from "../../../../shared/ui/input";
import { Bookmark, BookOpen, Heart, Loader2 } from "lucide-react";
import { Button } from "../../../../shared/ui/button";
import { supabase } from "../../../../shared/lib/supabaseClient";
import { useParams } from "react-router-dom";
import { useAuthContext } from "../../../auth/hooks/useAuthContext";

export const TagTemplate = () => {
    const { id, service } = useParams();
    const categoryId = Number(id);
    const {
        profileId,
        loading,
        isAuth
    } = useAuthContext();

    const handleLogout = async () => {
        await supabase.auth.signOut();
    }

    const [tagArticles, setTagArticles] = useState<
        TagArticleWithRelations[]
    >([]);

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

    // 選択したカテゴリー名を抽出
    const categoryName = categories.find(category => category.id === categoryId)?.name ?? '';

    const [keyword, setKeyword] = useState("")
    // お気に入り記事の取得
    useEffect(() => {
        const fetchData = async () => {
            if (!categoryId || !profileId) return;

            // 1. category取得
            const { data: category }: {
                data: Category | null;
            } = await supabase
                .from("categories")
                .select("id, name")
                .eq("id", categoryId)
                .single();

            if (!category) return;

            // 2. tags取得
            const { data: tags }: {
                data: Tags[] | null;
            } = await supabase
                .from("tags")
                .select("id, name");

            // categories.name と tags.name を
            // 大文字小文字無視で完全一致
            const matchedTags = (tags ?? []).filter(
                tag =>
                    tag.name.toLowerCase() ===
                    category.name.toLowerCase()
            );

            const tagIds = matchedTags.map(tag => tag.id);

            if (tagIds.length === 0) {
                setTagArticles([]);
                return;
            }

            // 3. article_tags取得
            const { data: articleTags }: {
                data: ArticleTags[] | null;
            } = await supabase
                .from("article_tags")
                .select(`
            id,
            article_id,
            tag_id,
            created_at,
            updated_at
        `)
                .in("tag_id", tagIds);

            const tagData = articleTags ?? [];

            const articleIds = tagData.map(t => t.article_id);

            if (articleIds.length === 0) {
                setTagArticles([]);
                return;
            }

            // 4. articles取得
            const { data: articles }: {
                data: Articles[] | null;
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
                .in("id", articleIds)
                .ilike("url", `%${service}%`)
                .ilike("title", `%${keyword}%`);

            const articleData = articles ?? [];

            // tag_id -> tag map
            const tagMap = new Map(
                matchedTags.map(tag => [tag.id, tag])
            );

            // 5. merge
            const merged = tagData
                .filter(tag =>
                    articleData.some(
                        article => article.id === tag.article_id
                    )
                )
                .map(tag => {
                    const article =
                        articleData.find(
                            a => a.id === tag.article_id
                        ) ?? null;

                    const matchedTag =
                        tagMap.get(tag.tag_id) ?? null;

                    return {
                        ...tag,
                        tag: matchedTag,
                        articles: article,
                        category
                    };
                });

            setTagArticles(merged);
        };

        fetchData();
    }, [categoryId, keyword, service]);

    return (
        <div className={styles.wrapper}>
            <Layout />
            <main className={styles.main}>
                <div className={styles.topContainer}>
                    <h2 className={styles.heading}>{categoryName}</h2>
                    <div className={styles.searchContainer}>
                        <Input
                            type="text"
                            placeholder="Search"
                            inputSize="md"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setKeyword(e.currentTarget.value);
                                }
                            }}
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
                            tagArticles.map(article => (
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
                                                    className={
                                                        favoriteCategoryMap[
                                                            `${article.article_id}-${categoryId}`
                                                        ]
                                                            ? styles.active
                                                            : ""
                                                    }
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
                                                                    variant={
                                                                        favoriteCategoryMap[
                                                                            `${article.article_id}-${category.id}`
                                                                        ]
                                                                            ? "quaternary"
                                                                            : "tertiary"
                                                                    }
                                                                    onClick={() =>
                                                                        toggleFavorite(
                                                                            article.article_id,
                                                                            category.id
                                                                        )
                                                                    }
                                                                >
                                                                    {favoriteCategoryMap[
                                                                        `${article.article_id}-${category.id}`
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