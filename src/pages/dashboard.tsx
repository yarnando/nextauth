import { useContext, useEffect } from "react"
import { AuthContext } from "../../contexts/AuthContext"
import { setupAPIClient } from "../services/api"
import { api } from "../services/apiClient"
import { withSSRAuth } from "../utils/withSSRAuth"

export default function Dashboard() {

    const { user } = useContext(AuthContext)

    useEffect(() => {
        api.get('/me')
            .then(response => console.log(response))
            .catch(err => console.log(err))
    }, [])

    return (
        <div>dashboard: {user?.email}</div>
    )
}

export const getServerSideProps = withSSRAuth(async (ctx) => {

    const apiClient = setupAPIClient(ctx);
    const response = await apiClient.get('/me')

    return {
        props: {}
    }
})
