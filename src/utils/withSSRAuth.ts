import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../services/errors/authTokenError";

export function withSSRAuth<P>(fn: GetServerSideProps<P>): GetServerSideProps {

    // o Next espera que a serversideprops retorne uma função, lá a gente está só chamando uma função. Portanto, temos que retornar OUTRA função, como resultado da função chamada
    return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {

        const cookies = parseCookies(ctx);
    
        if (!cookies['nextauth.token']) {
            return {
                redirect: {
                    destination: '/',
                    permanent: false, // só pro servidor saber se é pra acontecer sempre ou é só por causa de uma condição
                }
            }
        }

        try {
            return await fn(ctx) //essa 'fn' é a função que tá la no serversideprops
        } catch (error) {
    
            if(error instanceof AuthTokenError) {
                destroyCookie(ctx, 'nextauth.token')
                destroyCookie(ctx, 'nextauth.refreshToken')
        
                return {
                    redirect: {
                        destination: '/',
                        permanent: false,
                    }
                }                
            }
            
        } 
        
    }

}
