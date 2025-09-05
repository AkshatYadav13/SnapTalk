import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setSelectedUser } from '@/redux/authSlice';
import Messages from './Messages';
import { PiMessengerLogoThin } from "react-icons/pi";
import { Button } from './ui/button';
import {  MoreVertical } from 'lucide-react';
import { Popover,PopoverContent,PopoverTrigger } from './ui/popover';
import {  useNavigate } from 'react-router-dom';
import GroupMessages from './GroupMessages';
import { setSelectedGroup } from '@/redux/chatSlice';

const Chatpage = () => {
    const dispatch = useDispatch()
    const {user} = useSelector(store => store.auth)
    const {onlineUsers,newMessages,grpNewMsgs} = useSelector(store => store.chat)
    const {selectedUser} = useSelector(store => store.auth)
    const [mobView,setmobView] = useState(false)
    const [mobileChat,setMobileChat] = useState(false)
    const navigate = useNavigate()
    const {selectedGroup} = useSelector(store=> store.chat)
    const [activeFilter,setActiveFilter] = useState('All')

    useEffect(() => {
        const handleResize = () => {
        if (window.innerWidth <= 750) {
            setmobView(true);
        }else{
            setmobView(false)
            setMobileChat(false)
        }
        };
        handleResize();

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);


    function getNewMsgCount(userId){
        const arr =  newMessages.filter((m)=>m.senderId === userId )
        return arr.length > 0 && arr.length
    }

    function getGrpNewMsgs(groupId){
        const arr = grpNewMsgs.filter(m=> m.groupId === groupId)
        return arr.length > 0 && arr.length
    }

    function openChatView(){
        mobView && setMobileChat(true)
    }

    function closeChatView(){
        dispatch(setSelectedUser(''))
        dispatch(setSelectedGroup(''))
        mobView && setMobileChat(false)
    }


    function toggleMessages(u,type){
        if((!selectedUser && type==='user') || (type==='user' && u._id!==selectedUser._id)){
            dispatch(setSelectedUser(u))
            dispatch(setSelectedGroup(''))
            return
        }
        if((!selectedGroup && type==='group') || (type==='group' && u._id!==selectedGroup._id)){
            dispatch(setSelectedGroup(u))
            dispatch(setSelectedUser(''))
            return
        }
    }

    useEffect(()=>{
        return(()=>{
            dispatch(setSelectedUser(''))
            dispatch(setSelectedGroup(''))
        })
    },[])


  return (
    <div className='h-[100vh] w-full grid grid-cols-[1fr_2.7fr]  chatmb:grid-cols-1 dark:bg-[#1a1a1a] dark:text-white'>

        <div className={`h-full w-full border-r border-b-1  ${(mobileChat || (mobView && (selectedUser || selectedGroup)) )&& 'hidden'} dark:border-[#312e2e] `}>
            <div className='mb:pl-7 px-5 pt-9 pb-12  flex justify-between items-start border-b border-b-1 dark:border-[#312e2e]'>
                <div className='flex items-center  gap-x-4 gap-y-2 flex-wrap'>
                    <span className={` rounded-[10px]  text-center cursor-pointer text-sm px-4 py-[1px]  ${activeFilter==='All' ? 'bg-green-300 dark:text-black' : 'bg-gray-100 dark:bg-[#272727]' } `}     onClick={()=>setActiveFilter('All')}  >All</span>
                    <span className={` rounded-[10px]  text-center cursor-pointer text-sm px-3 py-[1px]  ${activeFilter==='friends' ? 'bg-green-300 dark:text-black' : 'bg-gray-100  dark:bg-[#272727]' }`}  onClick={()=>setActiveFilter('friends')} >friends</span>
                    <span className={` rounded-[10px]  text-center cursor-pointer text-sm px-3 py-[1px]  ${activeFilter==='groups' ? 'bg-green-300 dark:text-black' : 'bg-gray-100 dark:bg-[#272727]' }` }  onClick={()=>setActiveFilter('groups')}>groups</span>
                </div>


                <Popover>
                    <PopoverTrigger>
                        <MoreVertical className='cursor-pointer' ></MoreVertical>
                    </PopoverTrigger>
                    <PopoverContent  className='p-0 mb:w-[220px]'>
                        <div className=''>
                            <h1 className='hover:bg-gray-200 p-2 px-3 dark:hover:bg-[#212121]'  onClick={()=> navigate('/group/create')} >New Group</h1>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <div className='max-h-[86vh] w-full  min-w-[260px] custom-scrollbar overflow-auto' onClick={openChatView} >
                {
                    activeFilter==='All' ?(
                        (user?.friends.length === 0 && user?.groupJoined.length===0) 
                            ?<div className='text-center my-2 text-gray-500' >Start making friends or join group to stay connected</div>
                            :
                            <>
                                {user?.friends.map((u)=>
                                    <FriendComponent key={u._id}  u={u} toggleMessages={toggleMessages} getNewMsgCount={getNewMsgCount} onlineUsers={onlineUsers} ></FriendComponent>
                                )}
                                {user.groupJoined.map((g)=>
                                        <GroupComponent  key={g._id}   g={g} toggleMessages={toggleMessages} getGrpNewMsgs={getGrpNewMsgs} ></GroupComponent>
                                )}
                            </>
                    )
                    :activeFilter==='friends' ?(
                        user?.friends.length === 0 
                            ?<div className='text-center my-2 text-gray-500' >You haven't made any friends yet.</div>
                            :(user?.friends.map((u)=>
                                <FriendComponent key={u._id} u={u} toggleMessages={toggleMessages} getNewMsgCount={getNewMsgCount} onlineUsers={onlineUsers} ></FriendComponent>
                            )) 
                    ) 
                    :(
                        user?.groupJoined.length===0 
                            ?<div className='text-center my-2 text-gray-500' >You haven't joined any groups yet.</div>
                            :(
                                user.groupJoined.map((g)=>
                                    <GroupComponent  key={g._id}   g={g} toggleMessages={toggleMessages} getGrpNewMsgs={getGrpNewMsgs} ></GroupComponent>
                                )
                            )
                    )
                }
            </div>
        </div>
        {
            selectedUser
            ?(<Messages closeChatView={closeChatView} ></Messages>)

            :selectedGroup
            ?(<GroupMessages closeChatView={closeChatView} ></GroupMessages>)

            :<div className='chatmb:hidden flex items-center justify-center'>
                <div className='flex flex-col items-center justify-center'>
                    <PiMessengerLogoThin size={110} className='my-4'/>
                    <h1 className='text-2xl'>Your messages</h1>
                    <p className='font-thin' >Send a message to start a chat</p>
                    <Button className='my-5'>Send a message</Button>
                </div>
            </div>
        }
    </div>
  )
}

export default Chatpage


const FriendComponent = ({u,toggleMessages,getNewMsgCount,onlineUsers})=>{
    return(
        <div   onClick={()=>toggleMessages(u,'user')}  className='mb:pl-7 relative flex gap-4 items-center px-4 py-2 border-b border-b-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#212121]  dark:border-[#312e2e]'>
        <Avatar className='w-9 h-9  bg-gray-300' >
            <AvatarImage src={u?.profilePic} />
            <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <div>
            <h1 className='text-medium font-semibold text-nowrap mb:text-sm'>{u?.username}</h1>
            <span className={`text-sm font-medium dark:font-light ${onlineUsers.includes(u._id)? 'text-green-500':'text-red-500'} `} >{ onlineUsers.includes(u._id) ? 'Online' : 'Offline'}</span>
        </div>
        <p className='absolute right-2 bottom-2 bg-green-600 rounded-full text-white px-[6px] text-[10px] chatmb:right-6'>{getNewMsgCount(u._id)}</p>
    </div>
    )
}

const GroupComponent = ({g,toggleMessages,getGrpNewMsgs})=>{
    return(
        <div onClick={()=>toggleMessages(g,'group')}  className='relative flex gap-4 items-center px-4 py-2 border-b border-b-1 cursor-pointer hover:bg-gray-100  dark:hover:bg-[#212121] dark:border-[#312e2e]'>
            <Avatar className='w-10 h-10' >
                <AvatarImage  src={g?.icon} />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div>
                <h1 className='text-medium font-semibold text-nowrap mb:text-sm'>{g?.name}</h1>
                {
                    g?.onlineMembers?.length-1>0 &&
                    <span className={`text-sm dark:font-light font-medium  text-green-500`} >{`${g.onlineMembers.length-1} online member`}</span>
                }

            </div>
            <p className='absolute right-2 bottom-2 bg-green-600 rounded-full text-white px-[5px] text-[10px] chatmb:right-6'>{getGrpNewMsgs(g._id)}</p>
        </div>
    )
}

/*
{
    (activeFilter==='friends' || activeFilter==='All') &&(
       user?.friends.length>=0 ?
            (activeFilter==='All' 
                ?  <div className='text-center my-2 text-gray-500' >Start making friends or join group to stay connected</div>
                :  <div className='text-center my-2 text-gray-500' >You haven't made any friends yet.</div>
            )
        :
        user?.friends.map((u)=>
            <div key={u._id}  onClick={()=>toggleMessages(u,'user')}  className='mb:pl-7 relative flex gap-4 items-center px-4 py-2 border-b border-b-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#212121]  dark:border-[#312e2e]'>
                <Avatar className='w-9 h-9  bg-gray-300' >
                    <AvatarImage src={u?.profilePic} />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className='text-medium font-semibold text-nowrap mb:text-sm'>{u?.username}</h1>
                    <span className={`text-sm font-medium dark:font-light ${onlineUsers.includes(u._id)? 'text-green-500':'text-red-500'} `} >{ onlineUsers.includes(u._id) ? 'Online' : 'Offline'}</span>
                </div>
                <p className='absolute right-2 bottom-2 bg-green-600 rounded-full text-white px-[6px] text-[10px] chatmb:right-6'>{getNewMsgCount(u._id)}</p>
            </div>
        )                    
    )
}
{
    (activeFilter==='groups' || activeFilter==='All' ) &&(
        (user?.groupJoined.length>=0 && activeFilter==='groups') ? <div className='text-center my-2 text-gray-500' >You haven't joined any groups yet.</div>:
        user?.groupJoined.map((g)=>
            <div key={g._id}  onClick={()=>toggleMessages(g,'group')}  className='relative flex gap-4 items-center px-4 py-2 border-b border-b-1 cursor-pointer hover:bg-gray-100  dark:hover:bg-[#212121] dark:border-[#312e2e]'>
                <Avatar className='w-10 h-10' >
                    <AvatarImage  src={g?.icon} />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className='text-medium font-semibold text-nowrap mb:text-sm'>{g?.name}</h1>
                    {
                        g?.onlineMembers?.length-1>0 &&
                        <span className={`text-sm dark:font-light font-medium  text-green-500`} >{`${g.onlineMembers.length-1} online member`}</span>
                    }

                </div>
                <p className='absolute right-2 bottom-2 bg-green-600 rounded-full text-white px-[5px] text-[10px] chatmb:right-6'>{getGrpNewMsgs(g._id)}</p>
            </div>
        )
    )
}

*/