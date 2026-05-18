import { createClient } from '@supabase/supabase-js';

import {
    Article,
    ZennResponse,
    QiitaArticle,
    Tag,
    ZennArticleDetail
} from './types';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
);

// 非同期処理の結果にはPromiseで対応
async function fetchQiita(existingUrlSet: Set<string>): Promise<Article[]> {
    console.log('qiita start')
    const res = await fetch('https://qiita.com/api/v2/items?');
    const data: QiitaArticle[] = await res.json();
    console.log(data);
    // APIが壊れているものは除外
    if (!Array.isArray(data)) {
        console.error('Invalid Qiita response:', data);
        return [];
    }

    return await Promise.all(
        // urlが無いものは除外
        data
            .filter(item => !!item.title && !!item.url)

            // 整形されたデータを自前で用意した型に変換するためmapを使用
            // 既存記事チェックと新規記事に対してのみOGP画像を取得
            // Qiitaのタグを自前の型に変換
            .map(async (item): Promise<Article> => {
                const isExisting = existingUrlSet.has(item.url);

                let thumbnail_url: string | null = null;

                if (!isExisting) {
                    thumbnail_url = await fetchOgpImage(item.url);
                }

                return {
                    title: item.title,
                    url: item.url,
                    likes_count: item.likes_count ?? 0,
                    thumbnail_url,
                    tags: item.tags.map((tag): Tag => ({ name: tag.name }))
                };
            })
    );
}

async function fetchZenn(existingUrlSet: Set<string>): Promise<Article[]> {
    const res = await fetch('https://zenn.dev/api/articles?order=latest');
    const data: ZennResponse = await res.json();

    if (!data?.articles || !Array.isArray(data.articles)) {
        console.error('Invalid Zenn response:', data);
        return [];
    }

    return await Promise.all(
        data.articles.map(async (item): Promise<Article> => {
            const url = `https://zenn.dev${item.path}`;
            const isExisting = existingUrlSet.has(url);

            let thumbnail_url = '';

            if (!isExisting) {
                thumbnail_url = (await fetchOgpImage(url)) ?? '';
            }

            // Zennは一覧APIのみではタグが取得できないため記事詳細APIの取得が必要
            const detailRes = await fetch(`https://zenn.dev/api/articles/${item.slug}`);
            const detail: ZennArticleDetail = await detailRes.json();

            return {
                title: item.title,
                url,
                thumbnail_url,
                likes_count: item.liked_count ?? 0,
                tags: detail.article.topics.map((topic): Tag => ({ name: topic.name }))
            };
        })
    );
}

function decodeOgpUrl(url: string): string {
    return url.replace(/&amp;/g, '&').trim();
}

async function fetchOgpImage(url: string): Promise<string> {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept-Language': 'ja'
            }
        });

        const html = await res.text();

        const match = html.match(
            /<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i
        );

        if (!match?.[1]) {
            return '';
        }

        return decodeOgpUrl(match[1]);
    } catch (e) {
        console.error(e);
        return '';
    }
}

async function updateLikesCount() {
    // 直近7日記事のみ更新
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: articles, error } = await supabase
        .from('articles')
        .select(`id, url, created_at`)
        .gte('created_at', sevenDaysAgo);

    if (error || !articles) {
        console.error(error);
        return;
    }

    for (const article of articles) {
        try {
            let likes_count = 0;

            if (article.url.includes('qiita.com')) {
                const match = article.url.match(/qiita\.com\/.+\/items\/([a-zA-Z0-9]+)/);

                if (!match?.[1]) {
                    continue;
                }

                const itemId = match[1];

                // 記事詳細APIからいいね数を再取得
                const res = await fetch(`https://qiita.com/api/v2/items/${itemId}`);

                if (!res.ok) {
                    continue;
                }

                const data = await res.json();
                likes_count = data.likes_count ?? 0;
            } else if (article.url.includes('zenn.dev')) {
                const match = article.url.match(/zenn\.dev\/.+\/articles\/(.+)/);

                if (!match?.[1]) {
                    continue;
                }

                const slug = match[1];

                const res = await fetch(`https://zenn.dev/api/articles/${slug}`);

                if (!res.ok) {
                    continue;
                }

                const data = await res.json();
                likes_count = data.article?.liked_count ?? 0;
            }

            await supabase
                .from('articles')
                .update({ likes_count })
                .eq('id', article.id);
        } catch (e) {
            console.error(`failed: ${article.url}`, e);
        }
    }
}

async function main() {
    console.log('batch start');

    const { data: existingArticles } = await supabase
        .from('articles')
        .select('url');

    const existingUrlSet = new Set(existingArticles?.map(article => article.url));

    const [qiita, zenn] = await Promise.all([
        fetchQiita(existingUrlSet),
        fetchZenn(existingUrlSet)
    ]);

    const articles: Article[] = [...qiita, ...zenn];

    const newArticles = articles.filter(article => !existingUrlSet.has(article.url));

    const existingArticlesToUpdate = articles.filter(article => existingUrlSet.has(article.url));

    const allTagNames = Array.from(
        new Set(
            articles.flatMap(article => article.tags.map(tag => tag.name))
        )
    );

    await supabase
        .from('tags')
        .upsert(allTagNames.map(name => ({ name })), { onConflict: 'name' });

    const { data: tagRows } = await supabase
        .from('tags')
        .select('id, name')
        .in('name', allTagNames);

    if (!tagRows) {
        throw new Error('tagRows is null');
    }

    const tagMap = new Map(tagRows.map(tag => [tag.name, tag.id]));

    if (existingArticlesToUpdate.length > 0) {
        await supabase
            .from('articles')
            .upsert(
                existingArticlesToUpdate.map(article => ({
                    title: article.title,
                    url: article.url,
                    likes_count: article.likes_count ?? 0
                })),
                { onConflict: 'url' }
            );
    }

    if (newArticles.length > 0) {
        const { error } = await supabase
            .from('articles')
            .insert(
                newArticles.map(article => ({
                    title: article.title,
                    url: article.url,
                    likes_count: article.likes_count ?? 0,
                    thumbnail_url: article.thumbnail_url
                }))
            );

        if (error) {
            console.error(error);
            process.exit(1);
        }
    }

    const { data: allArticles } = await supabase
        .from('articles')
        .select('id, url');

    const articleMap = new Map(allArticles?.map(article => [article.url, article.id]));

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
        .upsert(articleTags, { onConflict: 'article_id,tag_id' });

    console.log('batch done');
}

async function run() {
    await main();
    await updateLikesCount();
}

run();