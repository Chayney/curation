import { useState } from "react";
import Layout from "../../../../shared/components/layouts/BaseLayout/BaseLayout";
import styles from "./style.module.css";
import { Loader2 } from "lucide-react";
import { useParams } from "react-router-dom";
import { useFavorite } from "../../hooks/useFavorite";
import { usePagination } from "../../hooks/usePagination";
import { useArticleActions } from "../../hooks/useArticleActions";
import { ArticleCard } from "../ArticleCard/ArticleCard";
import { Header } from "../../../../shared/components/layouts/Header/Header";
import { Pagination } from "../../../../shared/components/layouts/Pagination/Pagination";

export const FavoriteTemplate = () => {
    const { id } = useParams();
    const categoryId = Number(id);
    const [keyword, setKeyword] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");
    const {
        favoriteArticles,
        categories,
        profileId,
        loading: favoriteLoading,
        isAuth
    } = useFavorite(searchKeyword, categoryId);

    const pagination = usePagination(favoriteArticles);
        
    const actions = useArticleActions(profileId ?? undefined);
console.log(favoriteArticles)
    const categoryName = categories.find(item => item.id === categoryId)?.name ?? '';

    return (
        <Layout
            header={
                <Header
                    title={categoryName}
                    keyword={keyword}
                    onKeywordChange={setKeyword}
                    onSearch={(value) => {
                        setSearchKeyword(value);
                        pagination.setPage(1);
                    }}
                />
            }
        >
            <main className={styles.underContainer}>
                {favoriteLoading ? (
                    <Loader2 />
                ) : !isAuth ? (
                    <div>ログインしていません</div>
                ) : favoriteArticles.length === 0 ? (
                    <div className={styles.emptyCard}>
                        <h3>お気に入り記事はありません</h3>
                        <p>
                            記事一覧から♡ボタンを押してお気に入り登録してください。
                        </p>
                    </div>
                ) : (
                    <>
                        {pagination.paginated.map((article) => (
                            <ArticleCard
                                key={article.id}
                                article={article}
                                categories={categories}
                                {...actions}
                            />
                        ))}

                        <Pagination
                            totalItems={favoriteArticles.length}
                            itemsPerPage={10}
                            currentPage={pagination.page}
                            onPageChange={pagination.setPage}
                        />            
                    </>
                )}
            </main>
        </Layout>
    );
}