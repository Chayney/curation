import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"
import { supabase } from "../../../shared/lib/supabaseClient";
import { NAVIGATION_LIST } from "../../../shared/const/navigation";

export const useAuth = () => {
    const navigate = useNavigate();
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profileId, setProfileId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getSession = async () => {
            const { data } =
                await supabase.auth.getSession();

            const session = data.session;

            setSession(session);

            setUser(session?.user ?? null);

            if (session?.user?.id) {
                const {
                    data: profile,
                    error
                } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq(
                        "user_id",
                        session.user.id
                    )
                    .single();

                if (error) {
                    console.error(
                        "profile fetch error",
                        error
                    );

                    setProfileId(null);
                } else {
                    setProfileId(profile.id);
                }
            } else {
                setProfileId(null);
            }

            setLoading(false);

            if (!session) {
                navigate(NAVIGATION_LIST.LOGIN);
            }
        };

        getSession();
    }, [navigate]);

    const logout = async () => {
        await supabase.auth.signOut();

        setSession(null);
        setUser(null);
        setProfileId(null);

        navigate(NAVIGATION_LIST.LOGIN);
    };
    
    return {
        session,
        user,
        profileId,
        loading,
        isAuth: !!user,
        logout
    }
}