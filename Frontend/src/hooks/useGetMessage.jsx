import {  setMessages, setNewMessages, setUnseenMsgIds } from "@/redux/chatSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export function useGetMessage(){

    const dispatch = useDispatch()
    const {selectedUser} = useSelector(store => store.auth)
    const {newMessages} = useSelector(store => store.chat)

    const [unseenMsgCount,setUnseenMsgCount] = useState('')

    async function fetchMessages() {
        try {
            const res = await fetch(`http://localhost:8000/api/v1/message/get/${selectedUser?._id}`,{
                method:'get',
                credentials:'include'
            })
            const data = await res.json()
            if(data.success){
                const unseenMsgIdsArr =  newMessages?.filter((m)=> m.senderId === selectedUser?._id ).map((m)=> m._id)
                setUnseenMsgCount(unseenMsgIdsArr.length)
                dispatch(setUnseenMsgIds([...unseenMsgIdsArr]))
                
                const remainingMsg = newMessages.filter((m)=> !unseenMsgIdsArr.includes(m._id))
                dispatch(setNewMessages(remainingMsg))

                dispatch(setMessages(data.messages))
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(()=>{
        if(selectedUser){
            fetchMessages()
        }
    },[selectedUser])   

    return unseenMsgCount
}