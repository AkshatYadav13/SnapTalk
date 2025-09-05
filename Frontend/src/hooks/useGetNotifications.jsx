import { setNotifications } from "@/redux/rtnSlice"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"

export function useGetNotifications() {
    const {user} = useSelector(store => store.auth)
    const dispatch = useDispatch()

    async function fetchNotifications(){
        try {
            const res = await fetch(`http://localhost:8000/api/v1/notification/get`,{
                method:'Get',
                credentials:'include'
            })
            const data = await res.json()

            if(data.success){
                dispatch(setNotifications(data.notifications))
                return
            }

        } catch (error) {
            console.log(error)
        }
    }

    useEffect(()=>{
        user && fetchNotifications()
    },[user])
}