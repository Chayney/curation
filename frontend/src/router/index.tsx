import { BrowserRouter } from "react-router-dom"
import { AuthRouter } from "../features/auth/router/AuthRouter"
import { ArticleRouter } from "../features/article/router/ArticleRouter"
import { AuthProvider } from "../features/auth/contexts/AuthContext"

export const Router = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AuthRouter />
                <ArticleRouter />
            </AuthProvider>
        </BrowserRouter>
    )
}