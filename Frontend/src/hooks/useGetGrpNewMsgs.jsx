import { setGrpNewMessages } from "@/redux/chatSlice";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

export function useGetGrpNewMsgs(){
    const dispatch = useDispatch()

    async function fetchGrpNewMsgs() {
        try {
        const res = await fetch(`http://localhost:8000/api/v1/group/all/msgs/get/new`,{
            method:'get',
            credentials:'include'
        })
        const data = await res.json()

        if(data.success){
            data.newMsg.length>0 &&
            dispatch(setGrpNewMessages(data.newMsg))
            return
        }
            
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(()=>{
        fetchGrpNewMsgs()
    },[])
}