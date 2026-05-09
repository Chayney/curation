export type Tag = {
    name: string;
};

export type Article = {
    title: string;
    url: string;
    likes_count?: number;
    tags: Tag[];
};

export type QiitaTag = {
    name: string;
};

export type QiitaArticle = {
    title: string;
    url: string;
    likes_count: number;
    tags: QiitaTag[];
};

export type ZennTopic = {
    id: number;
    name: string;
    display_name: string;
    image_url?: string;
};

export type ZennArticle = {
    title: string;
    path: string;
    slug: string;
    liked_count?: number;
};

export type ZennResponse = {
    articles: ZennArticle[];
};

export type ZennArticleDetail = {
    article: {
        title: string;
        slug: string;
        topics: ZennTopic[];
    };
};

export type ArticleTag = {
    article_id: number;
    tag_id: number;
};