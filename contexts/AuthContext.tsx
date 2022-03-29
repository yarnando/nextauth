import Router from "next/router";
import { createContext, ReactNode, useEffect, useState } from "react";
import { setCookie, parseCookies } from "nookies";
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

    useEffect( () => {

        const { 'nextauth.token': token } = parseCookies() //devolve os cookies salvos

        if(token) {
            api.get('/me').then(response => {
                const { email, permissions, roles } = response.data

                setUser({ email, permissions, roles })
            })
        }

    }, [])

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
            setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/' // qualquer endereço tem acesso ao cookie (global)                
            })

            setUser({
                email,
                permissions,
                roles
            })

            api.defaults.headers['Authorization'] = `Bearer ${token}`

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