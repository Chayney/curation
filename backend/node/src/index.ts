import { createClient } from '@supabase/supabase-js'
import { Article, ZennResponse, QiitaArticle, Tag, ZennArticleDetail } from './types';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
)

// Qiita取得
async function fetchQiita(): Promise<Article[]> {
    console.log('start Qiita');

    const res = await fetch(
        'https://qiita.com/api/v2/items?per_page=40'
    );

    const data: QiitaArticle[] = await res.json();

    if (!Array.isArray(data)) {
        console.error('Invalid Qiita response:', data);
        return [];
    }

    return data
        .filter((item) =>
            !!item.title &&
            !!item.url
        )
        .map((item): Article => ({
            title: item.title,
            url: item.url,
            likes_count: item.likes_count ?? 0,
            tags: item.tags.map((tag): Tag => ({
                name: tag.name
            }))
        }));
}

// Zenn取得
async function fetchZenn(): Promise<Article[]> {
    console.log('start Zenn');

    const res = await fetch(
        'https://zenn.dev/api/articles?order=latest&count=5'
    );

    const data: ZennResponse = await res.json();

    if (!data?.articles || !Array.isArray(data.articles)) {
        console.error('Invalid Zenn response:', data);
        return [];
    }

    return await Promise.all(
        data.articles.map(async (item): Promise<Article> => {

            const detailRes = await fetch(
                `https://zenn.dev/api/articles/${item.slug}`
            );

            const detail: ZennArticleDetail =
                await detailRes.json();

            return {
                title: item.title,
                url: `https://zenn.dev${item.path}`,
                likes_count: item.liked_count ?? 0,
                tags: detail.article.topics.map((topic): Tag => ({
                    name: topic.name
                }))
            };
        })
    );
}

async function main() {
    console.log('batch start');

    const [qiita, zenn] = await Promise.all([
        fetchQiita(),
        fetchZenn()
    ]);

    const articles: Article[] = [...qiita, ...zenn];
    console.log('articles count:', articles);
    // tag重複排除
    const allTagNames = Array.from(
        new Set(
            articles.flatMap(article =>
                article.tags.map(tag => tag.name)
            )
        )
    );

    await supabase
        .from('tags')
        .upsert(
            allTagNames.map(name => ({ name })),
            { onConflict: 'name' }
        );

    const { data: tagRows } = await supabase
        .from('tags')
        .select('id, name')
        .in('name', allTagNames);

    if (!tagRows) {
        throw new Error('tagRows is null');
    }

    const tagMap = new Map(
        tagRows.map(tag => [tag.name, tag.id])
    );

    const { data: insertedArticles, error } = await supabase
        .from('articles')
        .upsert(
            articles.map(article => ({
                title: article.title,
                url: article.url,
                likes_count: article.likes_count ?? 0
            })),
            { onConflict: 'url' }
        )
        .select('id, url');

    if (error || !insertedArticles) {
        console.error(error);
        process.exit(1);
    }

    const articleMap = new Map(
        insertedArticles.map(article => [
            article.url,
            article.id
        ])
    );

    const articleTags = articles.flatMap(article =>
        article.tags.map(tag => {
            const tagId = tagMap.get(tag.name);
            const articleId = articleMap.get(article.url);

            if (tagId == null) {
                throw new Error(`Missing tag: ${tag.name}`);
            }

            if (articleId == null) {
                throw new Error(`Missing article: ${article.url}`);
            }

            return {
                article_id: articleId,
                tag_id: tagId
            };
        })
    );

    await supabase
        .from('article_tags')
        .upsert(articleTags, {
            onConflict: 'article_id,tag_id'
        });

    console.log('done');
}

main();
