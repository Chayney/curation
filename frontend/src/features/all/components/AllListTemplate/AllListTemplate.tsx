import { useEffect, useState } from "react";
import type { AllList } from "../../types/allList";
import Layout from "../../../../shared/layout/layout";
import styles from "./style.module.css";

export const AllListTemplate = () => {
    const [articles, setArticles] = useState<AllList[]>([]);

    useEffect(() => {
        fetch("https://qiita.com/api/v2/items?per_page=10")
            .then(res => res.json())
            .then(data => setArticles(data));
    }, []);

    return (
        <div className={styles.wrapper}>
            <Layout />
            <main className={styles.main}>
                <div className={styles.topContainer}>
                    <h2 className={styles.heading}>Qiita Articles</h2>
                    <div className={styles.searchContainer}>
                        <input
                            type="text"
                            placeholder="記事を検索..."
                            className={styles.search}
                        />
                    </div>
                    <div className={styles.underContainer}>
                        {articles.map(article => (
                            <a
                                key={article.id}
                                href={article.url}
                                target="_blank"
                                rel="noreferrer"
                                className={styles.card}
                            > 
                                <div className={styles.cardHeader}>
                                    <img
                                        src={`https://picsum.photos/800/600`}
                                        alt=""
                                        className={styles.avatar}
                                    />
                                </div>
                                <div className={styles.contentArea}>
                                    <h3 className={styles.title}>
                                        {article.title}
                                    </h3>
                                    <div className={styles.meta}>
                                        <span>
                                            🕒 {new Date(article.updated_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className={styles.tags}>
                                        {article.tags.map(tag => (
                                            <span key={tag.name} className={styles.tag}>
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}