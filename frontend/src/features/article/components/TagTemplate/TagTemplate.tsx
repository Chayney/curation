import { useState } from "react";
import Layout from "../../../../shared/components/layouts/BaseLayout/BaseLayout";
import { Header } from "../../../../shared/components/layouts/Header/Header";
import { Pagination } from "../../../../shared/components/layouts/Pagination/Pagination";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "../../../auth/hooks/useAuthContext";
import { usePagination } from "../../hooks/usePagination";
import { useArticleActions } from "../../hooks/useArticleActions";
import { ArticleCard } from "../ArticleCard/ArticleCard";
import styles from "./style.module.css";
import { useParams } from "react-router-dom";
import { useTag } from "../../hooks/useTag";

export const TagTemplate = () => {
    const { id, service } = useParams();
    
    const categoryId = Number(id);
    const { profileId, isAuth } = useAuthContext();

    const [keyword, setKeyword] = useState("");
    const [searchKeyword, setSearchKeyword] = useState("");

    const { tagWithArticles, category, categories, loading: feedLoading } = useTag(searchKeyword, categoryId, service)

    const pagination = usePagination(tagWithArticles);

    const actions = useArticleActions(profileId ?? undefined);

    const categoryName = category?.id === categoryId ? category.name : '';

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
                {feedLoading ? (
                    <Loader2 />
                ) : !isAuth ? (
                    <div>ログインしていません</div>
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
                            totalItems={tagWithArticles.length}
                            itemsPerPage={10}
                            currentPage={pagination.page}
                            onPageChange={pagination.setPage}
                        />
                    </>
                )}
            </main>
        </Layout>
    );
};