import { createClient } from '@supabase/supabase-js'
import { Article, ZennResponse, QiitaArticle, Tag, ZennArticleDetail } from './types';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
)

// Qiita取得
async function fetchQiita(
    existingUrlSet: Set<string>
): Promise<Article[]> {

    console.log('start Qiita');

    const res = await fetch(
        'https://qiita.com/api/v2/items?per_page=25'
    );

    const data: QiitaArticle[] = await res.json();

    if (!Array.isArray(data)) {
        console.error('Invalid Qiita response:', data);
        return [];
    }

    return await Promise.all(
        data
            .filter((item) =>
                !!item.title &&
                !!item.url
            )
            .map(async (item): Promise<Article> => {

                const isExisting =
                    existingUrlSet.has(item.url);

                let thumbnail_url: string | null = null;

                // 新規記事だけOGP取得
                if (!isExisting) {
                    thumbnail_url =
                        await fetchOgpImage(item.url);
                }

                return {
                    title: item.title,
                    url: item.url,
                    likes_count: item.likes_count ?? 0,
                    thumbnail_url,
                    tags: item.tags.map((tag): Tag => ({
                        name: tag.name
                    }))
                };
            })
    );
}

// Zenn取得
async function fetchZenn(
    existingUrlSet: Set<string>
): Promise<Article[]> {

    console.log('start Zenn');

    const res = await fetch(
        'https://zenn.dev/api/articles?order=latest&count=25'
    );

    const data: ZennResponse = await res.json();

    if (!data?.articles || !Array.isArray(data.articles)) {

        console.error('Invalid Zenn response:', data);

        return [];
    }

    return await Promise.all(

        data.articles.map(async (item): Promise<Article> => {

            const url =
                `https://zenn.dev${item.path}`;

            const isExisting =
                existingUrlSet.has(url);

            let thumbnail_url = '';

            // 新規記事だけOGP取得
            if (!isExisting) {
                thumbnail_url =
                    (await fetchOgpImage(url)) ?? '';
            }

            const detailRes = await fetch(
                `https://zenn.dev/api/articles/${item.slug}`
            );

            const detail: ZennArticleDetail =
                await detailRes.json();

            return {
                title: item.title,
                url,
                thumbnail_url,
                likes_count: item.liked_count ?? 0,
                tags: detail.article.topics.map(
                    (topic): Tag => ({
                        name: topic.name
                    })
                )
            };
        })
    );
}

function decodeOgpUrl(url: string) {
    return url
        .replace(/&amp;/g, '&')
        .replace(/&/g, '&')
        .trim();
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

        if (!match?.[1]) return '';

        // ★ここが重要
        const raw = match[1];

        return decodeOgpUrl(raw);

    } catch (e) {
        console.error(e);
        return '';
    }
}

async function main() {

    console.log('batch start');

    // 既存記事取得
    const { data: existingArticles } = await supabase
        .from('articles')
        .select('url');

    const existingUrlSet = new Set(
        existingArticles?.map(article => article.url)
    );

    // 記事取得
    const [qiita, zenn] = await Promise.all([
        fetchQiita(existingUrlSet),
        fetchZenn(existingUrlSet)
    ]);

    const articles: Article[] = [...qiita, ...zenn];

    console.log('articles count:', articles.length);

    // =========================
    // 新規記事 / 既存記事 分離
    // =========================

    const newArticles = articles.filter(
        article => !existingUrlSet.has(article.url)
    );

    const existingArticlesToUpdate = articles.filter(
        article => existingUrlSet.has(article.url)
    );

    // =========================
    // タグ処理
    // =========================

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

    // =========================
    // 既存記事: likes更新のみ
    // =========================

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

    // =========================
    // 新規記事: thumbnail含めINSERT
    // =========================

    let insertedArticles: any[] = [];

    if (newArticles.length > 0) {

        const { data, error } = await supabase
            .from('articles')
            .insert(
                newArticles.map(article => ({
                    title: article.title,
                    url: article.url,
                    likes_count: article.likes_count ?? 0,
                    thumbnail_url: article.thumbnail_url
                }))
            )
            .select('id, url');

        if (error || !data) {
            console.error(error);
            process.exit(1);
        }

        insertedArticles = data;
    }

    // =========================
    // articleMap 作成
    // =========================

    const { data: allArticles } = await supabase
        .from('articles')
        .select('id, url');

    const articleMap = new Map(
        allArticles?.map(article => [
            article.url,
            article.id
        ])
    );

    // =========================
    // article_tags
    // =========================

    const articleTags = articles.flatMap(article =>
        article.tags.map(tag => {

            const tagId = tagMap.get(tag.name);

            const articleId =
                articleMap.get(article.url);

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
