import { Route, Routes } from "react-router-dom"
import { NAVIGATION_LIST } from "../../../shared/const/navigation"
import { RegisterPage } from "../../../pages/RegisterPage"
import { LoginPage } from "../../../pages/LoginPage"

export const AuthRouter = () => {
    return (
        <Routes>
            <Route path={NAVIGATION_LIST.REGISTER} element={<RegisterPage />} />
            <Route path={NAVIGATION_LIST.LOGIN} element={<LoginPage />} />
        </Routes>
    )
}