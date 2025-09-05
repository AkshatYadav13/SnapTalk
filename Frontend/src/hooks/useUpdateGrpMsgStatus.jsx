import { clearGrpUnseenMsgIds} from "@/redux/chatSlice";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

export function useUpdateGrpMsgStatus(groupId){

    const {grpUnseenMsgIds,seletedGroup} = useSelector(store => store.chat)
    const dispatch = useDispatch()

    async function updateGrpMsgStatus() {
        try {
            const res = await fetch(`http://localhost:8000/api/v1/group/msgs/status/update/${groupId}`,{
                method:'POST',
                credentials:'include',
                body: JSON.stringify({'msgIds':grpUnseenMsgIds }),
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
                dispatch(clearGrpUnseenMsgIds())
                return
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(()=>{
        if(grpUnseenMsgIds && grpUnseenMsgIds.length>0 && groupId){
            updateGrpMsgStatus()
        }
    },[grpUnseenMsgIds,seletedGroup])   
}