import { useEffect, useState } from "react";
import { supabase } from "../../../shared/lib/supabaseClient";
import type {
    Article,
    Category,
    ArticleTagRow,
    ArticleWithTags
} from "../types/article";

// 記事用のテーブルとタグ用のテーブルがあるためそれぞれの記事に対してのタグをマージする
const mergeTags = (
    articles: Article[],
    articleTags: ArticleTagRow[]
): ArticleWithTags[] => {
    const tagMap = new Map<number, string[]>();

    articleTags.forEach((at) => {
        if (!at.tags) return;

        const tagsArray = Array.isArray(at.tags)
            ? at.tags
            : [at.tags];

        const names = tagsArray.map((t) => t.name);

        const current = tagMap.get(Number(at.article_id)) ?? [];

        tagMap.set(Number(at.article_id), [
            ...new Set([...current, ...names])
        ]);
    });

    return articles.map((article) => ({
        ...article,
        tags: tagMap.get(article.id) ?? []
    }));
};

// FeedとTrendをsortTypeで切り分ける
export const useArticleData = (
    keyword: string,
    sortType: "latest" | "popular" = "latest"
) => {
    const [articles, setArticles] = useState<ArticleWithTags[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);

    // supabaseでjoinすると不安定なので記事一覧とタグを取得後にマージする
    useEffect(() => {
        let ignore = false;

        const fetch = async () => {
            setLoading(true);

            try {
                const { data: articlesData, error: articlesError } =
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
                        .order(
                            sortType === "popular"
                                ? "likes_count"
                                : "created_at",
                                { ascending: false }
                        )
                        .ilike("title", `%${keyword}%`);

                if (articlesError) {
                    console.error(articlesError);
                    return;
                }

                const { data: tagsData, error: tagsError } =
                    await supabase
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

                if (ignore) return;

                const safeArticles: Article[] = articlesData ?? [];
                const safeTags: ArticleTagRow[] = tagsData ?? [];

                const merged = mergeTags(safeArticles, safeTags);

                setArticles(merged);
            } finally {
                setLoading(false);
            }
        };

        fetch();

        return () => {
            ignore = true;
        };
    }, [keyword, sortType]);

    // カテゴリー一覧の取得
    useEffect(() => {
        const fetchCategories = async () => {
            const { data, error } = await supabase
                .from("categories")
                .select("id, name");

            if (error) {
                console.error(error);
                return;
            }

            setCategories(data ?? []);
        };

        fetchCategories();
    }, []);

    return {
        articles,
        categories,
        loading
    };
};