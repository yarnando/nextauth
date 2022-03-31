import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { parseCookies } from "nookies";

export function withSSRGuest<P>(fn: GetServerSideProps<P>): GetServerSideProps {

    // o Next espera que a serversideprops retorne uma função, lá a gente está só chamando uma função. Portanto, temos que retornar OUTRA função, como resultado da função chamada
    return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {

        const cookies = parseCookies(ctx);
    
        if (cookies['nextauth.token']) {
            return {
                redirect: {
                    destination: '/dashboard',
                    permanent: false, // só pro servidor saber se é pra acontecer sempre ou é só por causa de uma condição
                }
            }
        }

        return await fn(ctx) //essa 'fn' é a função que tá la no serversideprops
        
    }

}
