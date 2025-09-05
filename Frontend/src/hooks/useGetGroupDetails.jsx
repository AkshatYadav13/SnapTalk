import { setGrpNewMessages, setGrpUnseenMsgIds, setSelectedGroup } from "@/redux/chatSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";

export  function useGetGroupDetails(groupID) {

    const dispatch = useDispatch()

    const {grpNewMsgs} = useSelector(store => store.chat)
    const [unseenMsgCount,setUnseenMsgCount] = useState('')

    async function fetchGroupDetails(){
        try {
            const res = await fetch(`http://localhost:8000/api/v1/group/get/${groupID}`,{
                method:'get',
                credentials:'include',
            })
            const data = await res.json()

            if(!res.ok){
                toast.error(data.message)
                return
            }
            if(data.success){
                const grpUnseenMsgIdsArr =  grpNewMsgs?.filter(m=> m.groupId === groupID).map(m=> m._id)
                setUnseenMsgCount(grpUnseenMsgIdsArr.length)
                dispatch(setGrpUnseenMsgIds(grpUnseenMsgIdsArr))

                const remainingNewMsg = grpNewMsgs?.filter(m=> m.groupId !== groupID)
                dispatch(setGrpNewMessages(remainingNewMsg))

                dispatch(setSelectedGroup(data.group))
                return
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(()=>{
        groupID && fetchGroupDetails()
    },[groupID])
    
    return unseenMsgCount;
}