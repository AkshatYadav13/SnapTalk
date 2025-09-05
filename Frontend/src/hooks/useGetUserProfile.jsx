import { setUserProfile } from "@/redux/authSlice";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

export function useGetUserProfile(userId){

    const dispatch = useDispatch()

    async function fetchUserProfile() {
        try {
            const res = await fetch(`http://localhost:8000/api/v1/user/profile/${userId}`,{
                method:'get',
                credentials:'include'
            })
            const data = await res.json()

            if(data.success){
                dispatch(setUserProfile(data.user))
                return
            }

        } catch (error) {
            console.log(error)
        }
    }

    useEffect(()=>{
        fetchUserProfile()
    },[userId])
}

