import { Button } from "../../../../shared/components/ui/button"
import { Input } from "../../../../shared/components/ui/input"
import styles from "./style.module.css"
import { useNavigate } from "react-router-dom"
import { NAVIGATION_LIST } from "../../../../shared/const/navigation"
import { useRegister } from "../../hooks/useRegister"

export const RegisterTemplate = () => {
    const navigate = useNavigate();
    const { 
        email,
        name,
        password,
        inputEmail,
        inputName,
        inputPassword,
        register
    } = useRegister();

    const handleRegister = async (event: React.SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault();
        await register();
        navigate(NAVIGATION_LIST.LOGIN);
    }

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Register</h1>
            <form className={styles.form} onSubmit={handleRegister}>
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
                        type="text"
                        placeholder="Name"
                        variant="primary"
                        onChange={inputName}
                        value={name}
                    />
                </div>
                <div className={styles.area}>
                    <Input
                        type="password"
                        placeholder="Password"
                        onChange={inputPassword}
                        value={password}
                    /> 
                </div>
                <div className={styles.area}>
                    <Button type="submit">Register</Button>
                </div>
            </form>
        </div>
    )
}