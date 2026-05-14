export type Category = {
    id: number;
    name: string;
}

export type Tag = {
    name: string;
};

export type Article = {
    id: number;
    title: string;
    url: string;
    thumbnail_url: string;
    likes_count: number;
    created_at: string;
    updated_at: string;
};

export type Articles = {
    id: number;
    title: string;
    url: string;
    thumbnail_url: string;
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

export type ArticleWithTags = Article & {
    tags: string[];
};

export type ArticleTagRow = {
    article_id: number;
    tags: {
        name: string;
    }[];
};

export type Bookmarks = {
    id: number;
    article_id: number;
    profile_id: number;
}

export type BookmarkArticle = {
    id: number;
    article_id: number;
    profile_id: number;
    articles: {
        id: number;
        title: string;
        url: string;
        thumbnail_url: string;
        likes_count: number;
        created_at: string;
        updated_at: string;
    } | null;
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
        thumbnail_url: string;
        likes_count: number;
        created_at: string;
        updated_at: string;
    } | null;
}