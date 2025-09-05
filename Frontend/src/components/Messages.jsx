import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { setMessages } from '@/redux/chatSlice';
import { LiaCheckDoubleSolid, LiaCheckSolid } from "react-icons/lia";
import { useUpdateMsgStatus } from '@/hooks/useUpdateMsgStatus';
import { useGetMessage } from '@/hooks/useGetMessage';
import { IoMdArrowBack } from "react-icons/io";
import { IoSend } from "react-icons/io5";
import { formatDate } from '@/lib/utils';
import { useSocket } from '@/lib/SocketContext';

const Messages = ({closeChatView}) => {

    useUpdateMsgStatus()
    const unseenMsgCount =  useGetMessage()

    const {messages} = useSelector(store=> store.chat)
    const [textMsg,setTextMsg] = useState('')
    const {selectedUser,user,theme} = useSelector(store => store.auth)
    const containerRef = useRef(null)
    const dispatch = useDispatch()
    const socket = useSocket();

    const backgroundImage = theme==='light'? `https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg` : `https://i.pinimg.com/originals/85/ec/df/85ecdf1c3611ecc9b7fa85282d9526e0.jpg`

    let msgDate = ''

    async function sendMsgHandler(receiverId) {
        const input = {
            message:textMsg
        }
        try {
            const res = await fetch(`http://localhost:8000/api/v1/message/send/${receiverId}`,{
                method:'post',
                credentials:'include',
                body:JSON.stringify(input),
                headers:{
                    'Content-type':'application/json'
                }
            })
            const data = await  res.json()
            if(data.success){
                dispatch(setMessages([...messages,data.newMsg]))
                setTextMsg('')
            }
            
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(()=>{
        if(containerRef.current){
            containerRef.current.scrollTop = containerRef.current.scrollHeight
        }

        socket?.on('updateStatus',(idsArr,newStatus) => {
            const newMsgArr = messages.map((m) =>
                idsArr.includes(m._id)
                    ? { ...m, status: newStatus }
                    : m
            );

            setTimeout(()=>{
                dispatch(setMessages(newMsgArr));
            },300)
        })
        
        return(()=>{
            socket?.off('updateStatus')
        })
    },[messages])

      function updateMsgDate(date){
        if(date){
          const formatedDate = formatDate(date).split(',')[0]
          msgDate = formatedDate
        }
      }

    return (
        <div className='flex flex-col '>
            
            <div className='pl-2 flex gap-1 items-center  border-b border-b-1 dark:border-[#312e2e]'>
                <IoMdArrowBack className='w-6 h-6 cursor-pointer' onClick={closeChatView} ></IoMdArrowBack>
                <div className='flex gap-4 items-center px-4 py-[18px] w-full '>
                    <Avatar className='w-12 h-12' >
                        <AvatarImage src={selectedUser?.profilePic} />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className='text-[17px] font-medium'>{selectedUser?.username}</h1>
                    </div>
                </div>
            </div>

            <div ref={containerRef} className='dark:text-black pt-10 h-[79vh] pb-4 flex  px-6 flex-col gap-4 custom-scrollbar overflow-auto items-baseline'   style={{ backgroundImage: `url('${backgroundImage}')`}} >
                {messages.map((m,idx)=>

                <div key={idx} className={`w-full flex flex-col gap-2`}>
                    {
                        (messages.length-idx) === unseenMsgCount &&
                        <div  className=' text-center my-3'>
                            <span className='bg-white px-3 py-1 rounded-[10px] text-sm'>{unseenMsgCount} new messages</span>
                        </div>
                    }

                    {
                      (!msgDate || msgDate!=formatDate(m.createdAt).split(',')[0]) &&
                      <div className='flex items-center justify-center w-full '>
                        <div className="dark:bg-[#272727] text-center text-gray-500 font-medium my-2 bg-white px-3 rounded-[10px]">{formatDate(m.createdAt).split(',')[0]}</div>
                      </div>
                    }
                
                    <div  className={`flex gap-2 ${m.senderId===user?._id && 'ml-auto'}`}>
                        <div className={`min-w-[120px] flex flex-col pb-7 justify-between gap-1 relative py-[6px] px-3 rounded-[12px] text-[16px]  max-w-[25vw] ${m.senderId===user._id ? 'bg-[#B4E380] ' : 'bg-gray-200' } `}>
                             <span>{m.message}</span>
                             
                           { m.senderId===user._id &&(
                                 m.status==='sent' ?
                                 <LiaCheckSolid className='text-gray-500  absolute bottom-1 right-3' ></LiaCheckSolid>
                                 :
                                 <LiaCheckDoubleSolid className={`absolute bottom-1 right-3 ${m.status==='seen' ? 'text-cyan-500' : 'text-gray-500' }`} />
                             )
                           }
                            <span className='absolute bottom-1 left-3 text-[13px] text-gray-600'>{formatDate(m.createdAt).split(',')[1].replace('/',':')}</span>
                        </div>
                    </div>  
                    {updateMsgDate(m.createdAt)}
                </div>
                )}

            </div>

            <div className=' pb-4 items-center'>
                <div className='relative flex items-center mx-5 lg:mx-6'>
                    <Input  
                        value={textMsg}
                        onChange={(e)=> setTextMsg(e.target.value)}  
                        type='text' className='border-[1px] border-gray-400 rounded-[10px] focus-visible:ring-transparent pr-10' placeholder='Start Messaging...'  
                        onKeyDown={(e)=>{
                            e.key === 'Enter' && sendMsgHandler(selectedUser?._id)
                        }}
                    />
                    {  
                        textMsg && <IoSend className='absolute right-2  w-5 h-5 cursor-pointer z-10' onClick={()=> sendMsgHandler(selectedUser?._id)} ></IoSend>         
                    }
                </div>
            </div>
        </div>
    )
}

export default Messages