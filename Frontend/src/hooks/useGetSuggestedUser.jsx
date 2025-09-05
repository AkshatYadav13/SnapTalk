import { setSuggestedUsers } from "@/redux/authSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

export function useGetSuggestedUser(){
    const dispatch = useDispatch()

    async function fetchSuggestedUser() {
        try {
            const res = await fetch(`https://snaptalk-q73h.onrender.com/api/v1/user/suggested`,{
                method:'get',
                credentials:'include'
            })
            const data = await res.json()

            if(!res.ok){
                toast.error(data.message)
                return
            }
            if(data.success){
                dispatch(setSuggestedUsers(data.suggestedUser))
                return
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(()=>{
        fetchSuggestedUser()
    },[])
}