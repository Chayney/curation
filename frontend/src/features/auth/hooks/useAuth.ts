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
        const syncProfile = async (userId: string | undefined) => {
            if (!userId) {
                setProfileId(null);
                return;
            }

            const { data: profile, error } = await supabase
                .from("profiles")
                .select("id")
                .eq("user_id", userId)
                .single();

            if (error) {
                console.error("profile fetch error", error);
                setProfileId(null);
                return;
            }

            setProfileId(profile.id);
        };

        const getSession = async () => {
            const { data } =
                await supabase.auth.getSession();
            const session = data.session;
            setSession(session);
            setUser(session?.user ?? null);
            await syncProfile(session?.user.id);
            setLoading(false);
            if (!session) {
                navigate(NAVIGATION_LIST.LOGIN);
            }
        };
        getSession();
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            async (_, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                await syncProfile(session?.user.id);
                setLoading(false);
                if (!session) {
                    navigate(NAVIGATION_LIST.LOGIN);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [navigate]);

    return {
        session,
        user,
        profileId,
        loading,
        isAuth: !!user
    }
}