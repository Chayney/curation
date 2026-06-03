import { useEffect, useState } from "react";
import { useAuthContext } from "../../auth/hooks/useAuthContext"
import { useArticleData } from "./useArticleData";
import type { ArticleWithTags, Favorite } from "../types/article";
import { supabase } from "../../../shared/lib/supabaseClient";

export const useFavorite = (
    keyword: string,
    categoryId? :number
) => {
    const { profileId, isAuth } = useAuthContext();
    const { articles, categories } = useArticleData(keyword);
    const [favoriteArticles, setFavoriteArticles] = useState<ArticleWithTags[]>([]);
    const [favoriteCategoryMap, setFavoriteCategoryMap] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
            let ignore = false;
    
            const fetchFavorites = async () => {
                if (!profileId) return;
    
                setLoading(true);
    
                try {
                    const { data: favorites }: {
                        data: Favorite[] | null;
                    } = await supabase
                        .from("favorites")
                        .select("id, article_id, profile_id, category_id")
                        .eq("profile_id", profileId)
                        .eq("category_id", categoryId);
    
                    const favoriteData: Favorite[] = favorites ?? [];
    
                    const articleMap = new Map(
                        articles.map((item) => [item.id, item])
                    );
    
                    const newMap: Record<number, boolean> = {};
    
                    const merged: ArticleWithTags[] = favoriteData
                        .map((item) => {
                            const article = articleMap.get(item.article_id);
    
                            if (!article) return null;
    
                            newMap[item.article_id] = true;
    
                            return article;
                        })
                        .filter(
                            (article): article is ArticleWithTags =>
                                article !== null
                        );
    
                    if (ignore) return;
    
                    setFavoriteCategoryMap(newMap);
                    setFavoriteArticles(merged);
                } finally {
                    if (!ignore) {
                        setLoading(false);
                    }
                }
            };
    
            fetchFavorites();
    
            return () => {
                ignore = true;
            };
        }, [profileId, categoryId, articles]);

    return {
        favoriteArticles,
        favoriteCategoryMap,
        categories,
        profileId,
        loading,
        isAuth
    }
}