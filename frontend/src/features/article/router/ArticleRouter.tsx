import { Route, Routes } from "react-router-dom"
import { NAVIGATION_LIST } from "../../../shared/const/navigation"
import { ArticlePage } from "../../../pages/ArticlePage"
import { FavoritePage } from "../../../pages/FavoritePage"

export const ArticleRouter = () => {
    return (
        <Routes>
            <Route path={NAVIGATION_LIST.TOP} element={<ArticlePage />} />
            <Route path={NAVIGATION_LIST.FAVORITE} element={<FavoritePage />} />
        </Routes>
    )
}