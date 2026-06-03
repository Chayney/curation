import { useEffect, useState } from "react";
import { useAuthContext } from "../../auth/hooks/useAuthContext";
import type {
    ArticleWithTags,
    Bookmarks
} from "../types/article";
import { supabase } from "../../../shared/lib/supabaseClient";
import { useArticleData } from "./useArticleData";

export const useBookmark = (keyword: string) => {
    const { profileId, isAuth } = useAuthContext();

    const { articles, categories } = useArticleData(keyword);

    const [bookmarkArticles, setBookmarkArticles] = useState<ArticleWithTags[]>([]);
    const [bookmarkArticleMap, setBookmarkArticleMap] = useState<Record<number, boolean>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let ignore = false;

        const fetchBookmarks = async () => {
            if (!profileId) return;

            setLoading(true);

            try {
                const { data: bookmarks }: {
                    data: Bookmarks[] | null;
                } = await supabase
                    .from("bookmarks")
                    .select("id, article_id, profile_id")
                    .eq("profile_id", profileId);

                const bookmarkData: Bookmarks[] = bookmarks ?? [];

                const articleMap = new Map(
                    articles.map((item) => [item.id, item])
                );

                const newMap: Record<number, boolean> = {};

                const merged: ArticleWithTags[] = bookmarkData
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

                setBookmarkArticleMap(newMap);
                setBookmarkArticles(merged);
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        };

        fetchBookmarks();

        return () => {
            ignore = true;
        };
    }, [profileId, articles]);

    return {
        bookmarkArticles,
        bookmarkArticleMap,
        categories,
        profileId,
        loading,
        isAuth
    };
};