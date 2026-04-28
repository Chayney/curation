import { useState } from "react";
import { supabase } from "../../../shared/lib/supabaseClient";

export const useLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const inputEmail = (event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value);

    const inputPassword = (event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value);

    const login = async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) {
            alert(error.message);
            return;
        }
        if (!data.session) {
            alert('ログインできません');
            return;
        }
    }

    return {
        email,
        password,
        inputEmail,
        inputPassword,
        login
    }
}