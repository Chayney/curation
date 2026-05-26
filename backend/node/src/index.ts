import { createClient } from '@supabase/supabase-js';

import type { QiitaArticle, ZennTopic, ZennResponse, ZennArticleDetail, ArticleTag, QiitaTag} from './types/index';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
);

const FETCH_LIMIT = 5;

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retries = 5
): Promise<Response | null> {
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, options);

            if (res.ok) return res;

        } catch (e) {
            console.warn('fetch error', url, e);
        }

        await sleep(1000 * Math.pow(2, i));
    }

    return null;
}

function decodeOgpUrl(url: string): string {
    return url.replace(/&amp;/g, '&').trim();
}

/**
 * fetch OGP image safely
 */
async function fetchOgpImage(url: string): Promise<string> {
    try {
        await sleep(2000);

        const res = await fetchWithRetry(
            url,
            {
                headers: {
                    'User-Agent':
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
                    'Accept-Language': 'ja',
                },
            },
            2
        );

        if (!res) {
            console.warn('OGP fetch failed:', url);
            return '';
        }

        const html = await res.text();

        const match = html.match(
            /<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i
        );

        if (!match?.[1]) return '';

        return decodeOgpUrl(match[1]);
    } catch (e) {
        console.warn('OGP error:', url, e);
        return '';
    }
}

/**
 * collect job (main pipeline)
 */
async function collectJob(): Promise<void> {
    console.log('collect start');

    /**
     * =========================
     * Qiita
     * =========================
     */
    const qiitaRes = await fetchWithRetry(
        `https://qiita.com/api/v2/items?page=1&per_page=${FETCH_LIMIT}`
    );

    if (!qiitaRes) {
        console.warn('Qiita list fetch failed');
        return;
    }

    let qiitaData: QiitaArticle[];

    try {
        qiitaData = await qiitaRes.json();
    } catch (e) {
        console.warn('Qiita JSON parse failed');
        return;
    }

    for (const item of qiitaData) {
        await supabase.from('articles').upsert(
            {
                title: item.title,
                url: item.url,
                likes_count: item.likes_count ?? 0,
            },
            { onConflict: 'url' }
        );

        const { data: articleRow } = await supabase
            .from('articles')
            .select('id')
            .eq('url', item.url)
            .single();

        if (!articleRow) continue;

        const topics =
            item.tags?.map((t: QiitaTag) => t.name) ?? [];

        for (const tag of topics) {
            const { data: tagRow } = await supabase
                .from('tags')
                .upsert({ name: tag }, { onConflict: 'name' })
                .select()
                .single();

            if (!tagRow) continue;

            await supabase.from('article_tags').upsert(
                {
                    article_id: articleRow.id,
                    tag_id: tagRow.id,
                },
                { onConflict: 'article_id,tag_id' }
            );
        }

        await sleep(500);
    }

    /**
     * =========================
     * Zenn
     * =========================
     */
    const zennRes = await fetchWithRetry(
        `https://zenn.dev/api/articles?order=latest&page=1&count=${FETCH_LIMIT}`
    );

    if (!zennRes) {
        console.warn('Zenn list fetch failed');
        return;
    }

    let zennData: ZennResponse;

    try {
        zennData = await zennRes.json();
    } catch (e) {
        console.warn('Zenn list JSON parse failed');
        return;
    }

    for (const item of zennData.articles) {
        const detailRes = await fetchWithRetry(
            `https://zenn.dev/api/articles/${item.slug}`
        );

        if (!detailRes) {
            console.warn('Zenn detail fetch failed:', item.slug);
            continue;
        }

        let detail: ZennArticleDetail;

        try {
            detail = await detailRes.json();
        } catch (e) {
            console.warn('Zenn detail JSON error:', item.slug);
            continue;
        }

        const url = `https://zenn.dev${item.path}`;

        await supabase.from('articles').upsert(
            {
                title: item.title,
                url,
                likes_count: detail.article?.liked_count ?? 0,
            },
            { onConflict: 'url' }
        );

        const { data: articleRow } = await supabase
            .from('articles')
            .select('id')
            .eq('url', url)
            .single();

        if (!articleRow) continue;

        const topics =
            detail.article?.topics?.map(
                (t: ZennTopic) => t.name
            ) ?? [];

        for (const tag of topics) {
            const { data: tagRow } = await supabase
                .from('tags')
                .upsert({ name: tag }, { onConflict: 'name' })
                .select()
                .single();

            if (!tagRow) continue;

            await supabase.from('article_tags').upsert(
                {
                    article_id: articleRow.id,
                    tag_id: tagRow.id,
                },
                { onConflict: 'article_id,tag_id' }
            );
        }

        await sleep(1500);
    }

    console.log('collect done');
}

/**
 * ogp job
 */
async function ogpJob(): Promise<void> {
    console.log('ogp start');

    const { data: articles } = await supabase
        .from('articles')
        .select('id, url')
        .is('thumbnail_url', null);
console.log(articles)
    if (!articles) {
        return;
    }

    for (const article of articles as {
        id: number;
        url: string;
    }[]) {
        try {
            const thumbnail_url =
                await fetchOgpImage(article.url);

            await supabase
                .from('articles')
                .update({
                    thumbnail_url
                })
                .eq('id', article.id);

            await sleep(3000);
        } catch (e) {
            console.error(e);
        }
    }

    console.log('ogp done');
}

/**
 * likes job
 */
async function likesJob(): Promise<void> {
    console.log('likes start');

    const { data: articles } = await supabase
        .from('articles')
        .select('id, url')
        .gte(
            'created_at',
            new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000
            ).toISOString()
        );

    if (!articles) return;

    for (const article of articles as {
        id: number;
        url: string;
    }[]) {
        try {
            let likes_count = 0;

            /**
             * =========================
             * Qiita
             * =========================
             */
            if (article.url.includes('qiita.com')) {
                const match = article.url.match(
                    /items\/([a-zA-Z0-9]+)/
                );

                if (!match?.[1]) continue;

                const res = await fetchWithRetry(
                    `https://qiita.com/api/v2/items/${match[1]}`
                );

                if (!res) {
                    console.warn('Qiita fetch failed:', article.url);
                    continue;
                }

                let data: QiitaArticle;

                try {
                    data = await res.json();
                } catch (e) {
                    console.warn('Qiita JSON error:', article.url);
                    continue;
                }

                likes_count = data.likes_count ?? 0;
            }

            /**
             * =========================
             * Zenn
             * =========================
             */
            else {
                const match = article.url.match(
                    /articles\/(.+)/
                );

                if (!match?.[1]) continue;

                const res = await fetchWithRetry(
                    `https://zenn.dev/api/articles/${match[1]}`
                );

                if (!res) {
                    console.warn('Zenn fetch failed:', article.url);
                    continue;
                }

                let data: ZennArticleDetail;

                try {
                    data = await res.json();
                } catch (e) {
                    console.warn('Zenn JSON error:', article.url);
                    continue;
                }

                likes_count = data.article?.liked_count ?? 0;
            }

            /**
             * update DB
             */
            await supabase
                .from('articles')
                .update({ likes_count })
                .eq('id', article.id);

            await sleep(2000);
        } catch (e) {
            console.error('likesJob item error:', e);
        }
    }

    console.log('likes done');
}

/**
 * entrypoint
 */
async function run(): Promise<void> {
    const mode = process.argv[2];

    try {
        switch (mode) {
            case 'collect':
                await collectJob();
                break;

            case 'ogp':
                await ogpJob();
                break;

            case 'likes':
                await likesJob();
                break;

            default:
                throw new Error('invalid mode');
        }

        process.exit(0);
    } catch (e) {
        console.error(e);

        process.exit(1);
    }
}

run();