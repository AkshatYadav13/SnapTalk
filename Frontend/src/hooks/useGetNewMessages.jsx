import { addNewMessages } from "@/redux/chatSlice";
import { useEffect,  useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export function useGetNewMessages(){

    const dispatch = useDispatch()
    const {newMessages} = useSelector(store=> store.chat)

    const [newMsgs,setnewMsgs] = useState(newMessages);

    useEffect(() => {
        setnewMsgs(newMessages)
    }, [newMessages]);


    async function fetchNewMessages() {
        try {
            const res = await fetch(`http://localhost:8000/api/v1/message/new/all`,{
                method:'get',
                credentials:'include'
            })
            const data = await res.json()

            if(data.success){
                data.newMessage.forEach((message) => {
                    if (!newMsgs.some((m) => m._id === message._id)) {
                        message.status = 'deleivered'
                        dispatch(addNewMessages(message));
                    }
                });              
                return
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(()=>{
        fetchNewMessages()
    },[])   
}


        