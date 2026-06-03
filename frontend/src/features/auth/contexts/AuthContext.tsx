import type { Session, User } from "@supabase/supabase-js"
import { createContext, type FC, type ReactNode } from "react"
import { useAuth } from "../hooks/useAuth"

type AuthContextProps = {
    children: ReactNode
}

type AuthContextType = {
    session: Session | null,
    user: User | null,
    profileId: number | null,
    loading: boolean,
    isAuth: boolean,
    logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    profileId: null,
    loading: true,
    isAuth: false,
    logout: async () => {}
});

export const AuthProvider: FC<AuthContextProps> = ({ children }) => {
    const { session, user, profileId, loading, isAuth, logout } = useAuth();

    return (
        <AuthContext.Provider
            value={{
                session,
                user,
                profileId,
                loading,
                isAuth,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}