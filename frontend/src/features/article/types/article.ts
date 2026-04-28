export type Category = {
    id: number;
    name: string;
}

export type Article = {
    id: number;
    url: string;
    title: string;
    likes_count: number;
    created_at: string;
    updated_at: string;
    article_tags: {
        tags: {
            name: string;
        } | null;
    }[];
}

export type Articles = {
    id: number;
    url: string;
    title: string;
    likes_count: number;
    created_at: string;
    updated_at: string;
}

export type ArticleTags = {
    id: number;
    article_id: number;
    tag_id: number;
    created_at: string;
    updated_at: string;
}

export type Favorite = {
    id: number;
    article_id: number;
    category_id: number;
    profile_id: number;
}

export type FavoriteArticle = {
    id: number;
    article_id: number;
    category_id: number;
    profile_id: number;
    key: string;
    articles: {
        id: number;
        title: string;
        url: string;
        likes_count: number;
        created_at: string;
        updated_at: string;
    } | null;
}