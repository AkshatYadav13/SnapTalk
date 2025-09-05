import { useSocket } from "@/lib/SocketContext";
import { addGrpNewMessages, addGrpUnseenMsgIds, addMessages, addNewMessages, addUnseenMsgIds, setSelectedGroup } from "@/redux/chatSlice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export function useGetRealTimeMsg(){

    const dispatch = useDispatch()
    const socket = useSocket();

    const {selectedUser} = useSelector(store => store.auth)
    const {messages,selectedGroup} = useSelector(store => store.chat)

    const [selUser,setSelUser] = useState(selectedUser)

    useEffect(()=>{
        setSelUser(selectedUser)
    },[selectedUser,messages])

    useEffect(()=>{
        if (!socket) return;
        socket?.on('newMessage',(newMsg)=>{
            if(newMsg.senderId === selUser?._id){
                dispatch(addUnseenMsgIds(newMsg._id))
                dispatch(addMessages(newMsg))
            }
            else{   
                dispatch(addNewMessages(newMsg))
            }
        })


        socket?.on('newGrpMessage',(grpMessage)=>{
            if(grpMessage.groupId=== selectedGroup._id){
                dispatch(addGrpUnseenMsgIds(grpMessage._id))
                const updatedSelGrp = {...selectedGroup,chat:[...selectedGroup.chat,grpMessage]}
                dispatch(setSelectedGroup(updatedSelGrp))
            }
            else{
                dispatch(addGrpNewMessages(grpMessage))
            }
        })

        return(()=>{
            socket?.off('newMessage')
            socket?.off('newGrpMessage')
        })
    },[socket,selUser,selectedGroup])   
}

