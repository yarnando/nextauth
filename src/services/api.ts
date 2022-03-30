import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../../contexts/AuthContext";

let cookies = parseCookies()
let isRefreshing = false
let failedRequestsQueue = [];

export const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
        Authorization: `Bearer ${cookies['nextauth.token']}`
    }
})

api.interceptors.response.use(response => {
    return response
}, (error: AxiosError) => {
    if(error.response.status === 401) {
        if(error.response.data?.code === 'token.expired') {
            // token expirado => renovar token
            cookies = parseCookies();

            const { 'nextauth.refreshToken': refreshToken } = cookies;
            const originalConfig = error.config //todas as informações sobre a requisição feita

            if(!isRefreshing) {

                isRefreshing = true

                api.post('/refresh', {
                    refreshToken
                }).then(response => {
                    const { token } = response.data;
    
                    setCookie(undefined, 'nextauth.token', token, {
                        maxAge: 60 * 60 * 24 * 30, // 30 days
                        path: '/' // qualquer endereço tem acesso ao cookie (global)
                    })
    
                    setCookie(undefined, 'nextauth.refreshToken', response.data.refreshToken, {
                        maxAge: 60 * 60 * 24 * 30, // 30 days
                        path: '/' // qualquer endereço tem acesso ao cookie (global)                
                    })  
    
                    api.defaults.headers['Authorization'] = `Bearer ${token}`

                    failedRequestsQueue.forEach(request => request.onSuccess(token))
                    failedRequestsQueue = []
    
                }).catch(err => {
                    failedRequestsQueue.forEach(request => request.onFailure(err))
                    failedRequestsQueue = []                    
                }).finally(() => {
                    isRefreshing = false
                })
            }

            //axios nao suporta async/await, por isso pra esperar uma requisição terminar antes de alguma coisa, deve-se usar uma Promise.
            return new Promise((resolve, reject) => {
                failedRequestsQueue.push({
                    onSuccess: (token: string) => {
                        originalConfig.headers['Authorization'] = `Bearer ${token}`

                        resolve(api(originalConfig))
                    },
                    onFailure: (err: AxiosError) => {
                        reject(err)
                    },
                })
            })
        } else {
            // erro que nao é token expirado => deslogar usuario
            signOut();
        }
    }

    return Promise.reject(error)
})