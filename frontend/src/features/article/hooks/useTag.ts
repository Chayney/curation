import { useEffect, useState } from "react";
import { supabase } from "../../../shared/lib/supabaseClient";
import type {
    Article,
    Category,
    ArticleTagRow,
    ArticleWithTags
} from "../types/article";

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

export const useTag = (
    keyword: string,
    categoryId?: number,
    service?: string
) => {
    const [tagWithArticles, setTagWithArticles] = useState<ArticleWithTags[]>([]);
    const [loading, setLoading] = useState(false);
    const [category, setCategory] = useState<Category | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    
    useEffect(() => {
        let ignore = false;

        const fetchData = async () => {
            if (!categoryId) return;
            
            setLoading(true);
            
            try {
                // 1. category取得
                const { data: categoryData } = await supabase
                    .from("categories")
                    .select("id, name")
                    .eq("id", categoryId)
                    .single();

                if (!categoryData) return;
                if (ignore) return;
                
                setCategory(categoryData);

                // 2. tags取得
                const { data: tagsData } = await supabase
                    .from("tags")
                    .select("id, name");

                const tags = tagsData ?? [];

                const matchedTags = tags.filter(
                    (tag) =>
                        tag.name.toLowerCase() ===
                        categoryData.name.toLowerCase()
                );

                const tagIds = matchedTags.map((t) => t.id);

                if (tagIds.length === 0) {
                    setTagWithArticles([]);
                    return;
                }

                // 3. article_tags取得
                const { data: articleTagsData } = await supabase
                    .from("article_tags")
                    .select(`
                        id,
                        article_id,
                        tag_id,
                        created_at,
                        updated_at,
                        tags ( name )
                    `)
                    .in("tag_id", tagIds);

                const articleTags = articleTagsData ?? [];

                const articleIds = articleTags.map(
                    (t) => t.article_id
                );

                if (articleIds.length === 0) {
                    setTagWithArticles([]);
                    return;
                }

                // 4. articles取得
                const { data: articlesData } = await supabase
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
                    .ilike("title", `%${keyword}%`)
                    .ilike("url", `%${service ?? ""}%`);

                const articles = articlesData ?? [];

                // 5. merge
                const merged = mergeTags(articles, articleTags);

                setTagWithArticles(merged);
            } catch (e) {
                console.error(e);
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        fetchData();

        return () => {
            ignore = true;
        };
    }, [categoryId, service, keyword]);

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
        tagWithArticles,
        category,
        categories,
        loading
    };
};