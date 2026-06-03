import { useEffect, useState } from "react";
import { supabase } from "../../../shared/lib/supabaseClient";

export const useArticleActions = (profileId?: number) => {
    const [bookmarkMap, setBookmarkMap] = useState<Record<number, boolean>>({});
    const [favoriteCategoryMap, setFavoriteCategoryMap] = useState<Record<string, boolean>>({});
    const [favoriteArticleMap, setFavoriteArticleMap] = useState<Record<number, boolean>>({});

    const [tooltip, setTooltip] = useState<{
        articleId: number;
        message: string;
    } | null>(null);

    const [openArticleId, setOpenArticleId] = useState<number | null>(null);

    // ブックマークとお気に入りのツールチップ
    const showTooltip = (articleId: number, message: string) => {
        setTooltip({ articleId, message });

        setTimeout(() => {
            setTooltip(null);
        }, 2000);
    };

    // カテゴリー一覧の開閉
    const toggleDropdown = (id: number) => {
        setOpenArticleId((prev) => (prev === id ? null : id));
    };

    const closeDropdown = () => setOpenArticleId(null);

    // ハートアイコン以外をクリックしてドロップダウンリストを閉じれるようにする
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;

            // 開いているdropdownがないなら何もしない
            if (openArticleId === null) return;

            const dropdown = document.querySelector(
                `[data-dropdown="${openArticleId}"]`
            );

            if (!dropdown) return;

            if (!dropdown.contains(target)) {
                setOpenArticleId(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openArticleId]);

    // ブックマーク済みか否かの判定
    const toggleBookmark = async (articleId: number) => {
        if (!profileId) return;

        const isBookmark = bookmarkMap[articleId];

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

            setBookmarkMap((prev) => ({
                ...prev,
                [articleId]: false
            }));

            showTooltip(articleId, "Delete Bookmark");
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

            setBookmarkMap((prev) => ({
                ...prev,
                [articleId]: true
            }));

            showTooltip(articleId, "Add Bookmark");
        }
    };

    // お気に入り済みか否かの判定
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

            // article単位の状態再計算
            const hasAnyFavorite = Object.entries({
                ...favoriteCategoryMap,
                [key]: false
            }).some(([k, v]) => {
                return k.startsWith(`${articleId}-`) && v;
            });

            setFavoriteArticleMap((prev) => ({
                ...prev,
                [articleId]: hasAnyFavorite
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

    // ブックマーク記事の取得
    useEffect(() => {
        if (!profileId) return;

        const fetchBookmarks = async () => {
            const { data, error } = await supabase
                .from("bookmarks")
                .select("article_id")
                .eq("profile_id", profileId);

            if (error) {
                console.error(error);
                return;
            }

            const map: Record<number, boolean> = {};

            data?.forEach((row) => {
                map[row.article_id] = true;
            });

            setBookmarkMap(map);
        };

        fetchBookmarks();
    }, [profileId]);

    // お気に入り記事の取得
    useEffect(() => {
        if (!profileId) return;

        const fetchFavorites = async () => {
            const { data, error } = await supabase
                .from("favorites")
                .select("article_id, category_id")
                .eq("profile_id", profileId);

            if (error) {
                console.error(error);
                return;
            }

            const categoryMap: Record<string, boolean> = {};
            const articleMap: Record<number, boolean> = {};

            data?.forEach((row) => {
                const key = `${row.article_id}-${row.category_id}`;
                categoryMap[key] = true;
                articleMap[row.article_id] = true;
            });

            setFavoriteCategoryMap(categoryMap);
            setFavoriteArticleMap(articleMap);
        };

        fetchFavorites();
    }, [profileId]);

    return {
        bookmarkMap,
        favoriteCategoryMap,
        favoriteArticleMap,

        tooltip,
        openArticleId,

        toggleBookmark,
        toggleFavorite,
        toggleDropdown,
        closeDropdown,
        showTooltip,
        setOpenArticleId
    };
};