import { Route, Routes } from "react-router-dom"
import { NAVIGATION_LIST } from "../../../shared/const/navigation"
import { FeedPage } from "../../../pages/FeedPage"
import { FavoritePage } from "../../../pages/FavoritePage"
import { TrendPage } from "../../../pages/TrendPage"
import { BookmarkPage } from "../../../pages/BookmarkPage"
import { TagPage } from "../../../pages/TagPage"

export const ArticleRouter = () => {
    return (
        <Routes>
            <Route path={NAVIGATION_LIST.FEED} element={<FeedPage />} />
            <Route path={NAVIGATION_LIST.TREND} element={<TrendPage />} />
            <Route path={NAVIGATION_LIST.BOOKMARK} element={<BookmarkPage />} />
            <Route path={NAVIGATION_LIST.TAG} element={<TagPage />} />
            <Route path={NAVIGATION_LIST.FAVORITE} element={<FavoritePage />} />
        </Routes>
    )
}