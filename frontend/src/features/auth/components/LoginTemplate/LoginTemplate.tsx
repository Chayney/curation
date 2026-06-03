import { Button } from "../../../../shared/components/ui/button"
import { Input } from "../../../../shared/components/ui/input"
import styles from "./style.module.css"
import { useNavigate } from "react-router-dom"
import { NAVIGATION_LIST } from "../../../../shared/const/navigation"
import { useLogin } from "../../hooks/useLogin"

export const LoginTemplate = () => {
    const navigate = useNavigate();
    const { 
        email,
        password,
        inputEmail,
        inputPassword,
        login
    } = useLogin();

    const handleLogin = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        try {
            await login();
            navigate(NAVIGATION_LIST.FEED);
        } catch (error) {
            alert('ログイン中にエラーが発生しました')
        }
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Login</h1>
            <form className={styles.form} onSubmit={handleLogin}>
                <div className={styles.area}>
                    <Input
                        type="email"
                        placeholder="Email"
                        variant="primary"
                        onChange={inputEmail}
                        value={email}
                    />
                </div>
                <div className={styles.area}>
                    <Input
                        type="password"
                        placeholder="Password"
                        variant="primary"
                        onChange={inputPassword}
                        value={password}
                    />
                </div>
                <div className={styles.area}>
                    <Button type="submit">Login</Button>
                </div>
            </form>
        </div>
    )
}