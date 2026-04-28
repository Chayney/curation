import { useState } from "react";
import { supabase } from "../../../shared/lib/supabaseClient";

export const useRegister = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    const inputEmail = (event: React.ChangeEvent<HTMLInputElement>) => setEmail(event.target.value);

    const inputName = (event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value);

    const inputPassword = (event: React.ChangeEvent<HTMLInputElement>) => setPassword(event.target.value);

    const register = async () => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });
        if (error) {
            console.error(error);
            return;
        }
        if (data.user) {
            const { error: profileError } = await supabase
                .from("profiles")
                .insert({
                    user_id: data.user.id,
                    name: name
                });
            if (profileError) {
                console.error(profileError);
            }
        }
    }
    
    return {
        email,
        name,
        password,
        inputEmail,
        inputName,
        inputPassword,
        register
    }
}