import { clearUnseenMsgIds } from "@/redux/chatSlice";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

export function useUpdateMsgStatus(){

    const {unseenMsgIds} = useSelector(store => store.chat)
    const {selectedUser} = useSelector(store => store.auth)
    const dispatch = useDispatch()

    async function updateMsgStatus() {
        try {
            const res = await fetch(`http://localhost:8000/api/v1/message/update/status/${selectedUser._id}`,{
                method:'POST',
                credentials:'include',
                body: JSON.stringify({unseenMsgIds }),
                headers: {
                    'Content-Type': 'application/json', 
                },
            })
            const data = await res.json()
            if(!res.ok){
                toast.error(data.message)
                return
            }

            if(data.success){
                dispatch(clearUnseenMsgIds())
                return
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(()=>{
        if(unseenMsgIds && unseenMsgIds.length>0){
            updateMsgStatus()
        }
    },[unseenMsgIds])   
}