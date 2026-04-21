import { BrowserRouter, Routes, Route } from "react-router-dom"
import { NAVIGATION_LIST } from "../shared/const/navigation"
import { AllListPage } from "../pages/AllListPage"

export const Router = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path={NAVIGATION_LIST.TOP} element={<AllListPage />} />
            </Routes>
        </BrowserRouter>
    )
}