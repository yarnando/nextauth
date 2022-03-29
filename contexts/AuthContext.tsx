import Router from "next/router";
import { createContext, ReactNode, useState } from "react";
import { setCookie } from "nookies";
import { api } from "../src/services/api";

type AuthProviderProps = {
    children: ReactNode;
}

type SignInCredentials = {
    email: string;
    password: string;
}

type User = {
    email: string;
    permissions: string[];
    roles: string[];
}

type AuthContextData = {
    signIn(credentials): Promise<void>;
    user: User;
    isAuthenticated: boolean;
}

export const AuthContext = createContext({} as AuthContextData)

export function AuthProvider({ children }: AuthProviderProps) {

    const [user, setUser] = useState<User>()
    const isAuthenticated = !!user;

    async function signIn({ email, password }: SignInCredentials) {

        try {
            const response = await api.post('sessions', {
                email,
                password
            })

            const { token, refreshToken, permissions, roles } = response.data

            //primeiro param(contexto de execução) sempre fica undefined quando é do lado do cliente
            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/' // qualquer endereço tem acesso ao cookie (global)
            })
            setCookie(undefined, 'nextauth.refreshToken', token, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/' // qualquer endereço tem acesso ao cookie (global)                
            })

            setUser({
                email,
                permissions,
                roles
            })

            Router.push('/dashboard')

            console.log(response.data);

        } catch (error) {
            console.log(error);
        }

    }

    return (
        <AuthContext.Provider value={{ signIn, isAuthenticated, user }} >
            {children}
        </AuthContext.Provider>
    )
}