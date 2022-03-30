import { useContext, useEffect } from "react"
import { AuthContext } from "../../contexts/AuthContext"
import { api } from "../services/api"

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
