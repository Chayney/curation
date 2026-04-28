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
        const check = async () => {
            const { data } = await supabase.auth.getSession();
            setSession(data.session);
            setUser(data.session?.user ?? null);
            if (!data.session) {
                navigate(NAVIGATION_LIST.LOGIN);
                setLoading(false);
                return;
            }

            // profile取得
            // ログインユーザーIDはprofilesテーブルのIDを使用
            const { data: profile, error } = await supabase
                .from("profiles")
                .select("id")
                .eq("user_id", data.session.user.id)
                .single();
            if (error) {
                console.error(error);
                setProfileId(null);
            } else {
                setProfileId(profile.id);
            }
            setLoading(false);
        };
        check();
    }, []);

    return {
        session,
        user,
        profileId,
        loading,
        isAuth: !!user
    }
}