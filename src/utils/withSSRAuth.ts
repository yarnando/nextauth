import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../services/errors/authTokenError";

import decode from "jwt-decode";
import validateUserPermissions from "./validateUserPermissions";

type WithSSRAuthOptions = {
    permissions?: string[];
    roles?: string[];
}

export function withSSRAuth<P>(fn: GetServerSideProps<P>, options?: WithSSRAuthOptions): GetServerSideProps {

    // o Next espera que a serversideprops retorne uma função, lá a gente está só chamando uma função. Portanto, temos que retornar OUTRA função, como resultado da função chamada
    return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {

        const cookies = parseCookies(ctx);
        const token = cookies['nextauth.token']

        if (!token) {
            return {
                redirect: {
                    destination: '/',
                    permanent: false, // só pro servidor saber se é pra acontecer sempre ou é só por causa de uma condição
                }
            }
        }

        if(options) {
            const user = decode<{ permissions: string[], roles: string[] }>(token)
            const { permissions, roles } = options
    
            const userHasValidPermissions = validateUserPermissions({
                user,
                permissions,
                roles
            }) 

            if(!userHasValidPermissions) {
                return {
                    redirect: {
                        destination: '/dashboard',
                        permanent: false,
                    }
                    // notFound: true, => se n tiver pagina aberta pra qqr permissao, pode jogar um notfound
                }
            }
        }

        try {
            return await fn(ctx) //essa 'fn' é a função que tá la no serversideprops
        } catch (err) {

            if (err instanceof AuthTokenError) {
                destroyCookie(ctx, 'nextauth.token')
                destroyCookie(ctx, 'nextauth.refreshToken')

                return {
                    redirect: {
                        destination: '/',
                        permanent: false
                    }
                }
            }

        }

    }

}
