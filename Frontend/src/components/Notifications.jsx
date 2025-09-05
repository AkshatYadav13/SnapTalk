import React, { useEffect, useRef, useState } from 'react'
import {Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { useDispatch, useSelector } from 'react-redux'
import { Avatar } from './ui/avatar'
import { AvatarImage } from '@radix-ui/react-avatar'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import {  deleteNotifications, setNotifications } from '@/redux/rtnSlice'
import { MdDelete } from "react-icons/md";
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { setUser } from '@/redux/authSlice'


const Notifications = () => {
    const {notifications} = useSelector(store => store.rtn)
    const [activeTab,setActiveTab] = useState('informative')
    const [showNotifications,setShowNotifications] = useState( notifications?.filter((n)=>n.category===activeTab))
    const {user} = useSelector(store => store.auth)
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const location = useLocation()

    useEffect(()=>{
        setShowNotifications(notifications?.filter((n)=>n?.category===activeTab))
    },[activeTab,notifications])


    function handleTabChange(tab){
        setActiveTab(tab)
    }
    

    async function deleteNotification(nId) {
        let arr =[]
        if(!nId){
            arr = showNotifications.map(n=> n._id)        
        }
        else{
            arr.push(nId)
        }
        try {
            const res = await fetch(`https://snaptalk-q73h.onrender.com/api/v1/notification/delete`,{
                method:'post',
                credentials:'include',
                body:JSON.stringify({notificationIds:arr}),
                headers: {
                    'Content-Type': 'application/json', 
                },
            })
            const data = await res.json()

            if(data.success){
                dispatch(deleteNotifications(arr))
                return
            }

        } catch (error) {
            console.log(error)
        }

    }

    async function acceptOrRejectHandler(senderId,action,notificationId) {
        const info = {
            action,
            notificationId
        }
        try {
            const res = await fetch(`https://snaptalk-q73h.onrender.com/api/v1/notification/friendReq/acceptOrReject/${senderId}`,{
                method:'POST',
                credentials:'include',
                body:JSON.stringify(info),
                headers:{
                    'Content-Type':'application/json'
                }
            })
            const data = await res.json()
            if(!res.ok){
                toast.error(data.message)
                return
            }
            if(data.success){
                toast.success(data.message)
                dispatch(deleteNotifications([notificationId]))
                let updatedUser
                if(action==='accept'){
                    updatedUser = {...user,friends:[...user.friends,data.user]}
                }
                dispatch(setUser(updatedUser))
                return
            }
        } catch (error) {
            console.log(error)
        }
    }


    async function updateStatus(){
        try {
            const res = await fetch(`https://snaptalk-q73h.onrender.com/api/v1/notification/updateStatus/${activeTab}`,{
                method:'get',
                credentials:'include',
            })
            const data = await res.json()
    
            if(data.success){
                if(data.notificationIds.length>0){
                    const updatedNotification = notifications.map(n => ({
                        ...n,
                        status: data.notificationIds.includes(n._id) ? 'seen' :n.status
                    }));                    
                    dispatch(setNotifications(updatedNotification))
                }
                return
            }
        } catch (error) {
            console.log(error)
        }
    }

    useEffect(() => {
        return () => {
            if (notifications.filter(n=> n.category===activeTab ).some(n => n.status !== 'seen')) {
                updateStatus();
            }
        };
    }, [location,activeTab]);

  return (
    <div className='w-full flex justify-center pt-[90px] px-5 dark:bg-[#1a1a1a] dark:text-white'>
        <div className='h-[78vh] flex flex-col gap-3 min-w-[70vw] border border-gray-300 dark:border-[#312e2e]' >
            <div className="flex  w-full items-center border-b border-gray-300 dark:border-[#312e2e]">
                <button className={`h-11 px-5  text-gray-600  text-[15px]   ${activeTab==='informative' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-[#212121]' } sm:text-[16px] `} onClick={()=> handleTabChange('informative')} >Informative</button>
                <button className={`h-11 px-5  text-gray-600  text-[15px]  ${activeTab==='request' ? 'bg-blue-500 text-white' : 'hover:bg-gray-200 dark:hover:bg-[#212121]'} sm:text-[16px] `} onClick={()=> handleTabChange('request')} >Requests</button>
            </div>

            <div className='h-[65vh] overflow-y-scroll custom-scrollbar pb-10'>
                {
                    showNotifications?.length === 0 
                    ?<p className='px-3 pt-3' >No new Notifications</p>
                    :
                    showNotifications?.map((n,idx)=>
                        {
                            if(n.category==='informative'){
                                if(n.type==='like' || n.type==='dislike'){
                                    return(
                                        <div key={idx} className='hover:bg-gray-200 cursor-pointer p-2 pt-6 pb-3 group flex items-end justify-between pr-3 relative dark:hover:bg-[#212121]'>
                                            <div className='flex items-center gap-3'>
                                                <Avatar className=' w-11 h-11 bg-gray-300' >
                                                    <AvatarImage src={n.senderId.profilePic}></AvatarImage>
                                                </Avatar>
                                                <div>
                                                    <p >
                                                        <span className='font-semibold'>{n.senderId.username}</span>
                                                        <span>{
                                                            n.type==='like'?
                                                            ' liked your ':
                                                            ' disliked your ' 
                                                        } 
                                                        </span>
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <span className='text-blue-600 cursor-pointer'>post...</span>
                                                            </DialogTrigger>
                                                            <DialogContent className='flex flex-col  text-sm text-center p-0 overflow-hidden' >
                                                                <div className='flex gap-5 items-center px-4 py-2' >
                                                                    <Avatar className='w-11 h-11  bg-gray-300' >
                                                                        <AvatarImage src={user?.profilePic} />
                                                                    </Avatar>
                                                                    <div className='flex flex-col items-start gap-1'>
                                                                        <h1 className='text-[17px] font-medium'>{user?.username}</h1>
                                                                        {
                                                                            n.postId?.author === user?._id &&  <Badge variant='secondary'>Author</Badge>
                                                                        }
                                                                    </div>
                                                                </div>
                                                                {   
                                                                    n.postId?.mediaType === 'image' ? (
                                                                    <img className="h-[500px] w-full" src={n.postId?.media}  alt="Post media" />
                                                                    ) : (
                                                                    <video className="w-full h-[500px] object-fill border-none" controls>
                                                                        <source src={n.postId?.media} type="video/mp4" />
                                                                        Your browser does not support the video tag.
                                                                    </video>
                                                                    )
                                                                }
                                                            </DialogContent>
                                                        </Dialog>
                                                    </p>
                                                    <span className='text-sm text-blue-500' onClick={()=> navigate(`/userProfile/${n.senderId._id}`) } >view profile</span>
                                                </div>
                                            </div>
                                            <MdDelete className='h-5 w-5 invisible hover:text-red-500 group-hover:visible' onClick={()=>deleteNotification(n._id)} ></MdDelete>
                                            {
                                                n.status!=='seen' &&
                                                <span className='bg-blue-500 text-sm text-white rounded-[8px] px-2  absolute right-5 top-0 '>new</span>
                                            }
                                        </div>
                                    )
                                }
                                if(n.type==='follow' || n.type==='unfollow'  || n.type==='grp_remove'  ){
                                    return(
                                        <div key={idx} className='relative group hover:bg-gray-200 cursor-pointer p-2 pt-6 pb-3 flex items-end justify-between pr-3 dark:hover:bg-[#212121]'>
                                            <div className='flex items-center gap-3'>
                                                <Avatar className=' w-11 h-11 bg-gray-300' >
                                                    <AvatarImage src={n.senderId.profilePic}></AvatarImage>
                                                </Avatar>
                                                <div>
                                                    <p >
                                                        <span className='font-semibold'>{n.senderId.username}</span>
                                                        <span> {n.type==='follow'?' has started following you ' : n.type==='unfollow'? ' has unfollowed you ' :`has removed you from the group ${n.group?.name? `(${n.group?.name})`:'' }` }</span>
                                                    </p>
                                                    <span className='text-sm text-blue-500'  onClick={()=> navigate(`/userProfile/${n.senderId._id}`)} >view profile</span>
                                                </div>
                                            </div>
                                            <MdDelete className=' h-5 w-5 invisible hover:text-red-500 group-hover:visible' onClick={()=> deleteNotification(n._id)} ></MdDelete>
                                            {
                                                n.status==='seen' &&
                                                <span className='bg-blue-500 text-sm text-white rounded-[8px] px-2  absolute right-5 top-0 '>new</span>
                                            }
                                        </div>
                                    )
                                }
                                if(n.type==='friend_removed'){
                                    return(
                                        <div key={idx} className='relative group hover:bg-gray-200 cursor-pointer p-2 pt-6 pb-3  flex items-end justify-between pr-3 dark:hover:bg-[#212121]'>
                                            <div className='flex items-center gap-3'>
                                                <Avatar className=' w-11 h-11 bg-gray-300' >
                                                    <AvatarImage src={n.senderId.profilePic}></AvatarImage>
                                                </Avatar>
                                                <div>
                                                    <p >
                                                        <span className='font-semibold'>{n.senderId.username}</span>
                                                        <span> has removed you from their friend list.</span>
                                                    </p>
                                                    <span className='text-sm text-blue-500'  onClick={()=> navigate(`/userProfile/${n.senderId._id}`)} >view profile</span>
                                                </div>
                                            </div>
                                            <MdDelete className='h-5 w-5 invisible hover:text-red-500 group-hover:visible' onClick={()=> deleteNotification(n._id)} ></MdDelete>
                                            {
                                                n.status!=='seen' &&
                                                <span className='bg-blue-500 text-sm text-white rounded-[8px] px-2  absolute right-5 top-0 '>new</span>
                                            }
                                        </div>
                                    )
                                }
                            }
                            else if(n.category==='request'){
                                if (n.type === 'friend_request') {
                                    return (
                                            <div key={idx} className="group relative hover:bg-gray-100/50 cursor-pointer p-3 px-2 pr-3 flex justify-between items-end gap-5 dark:hover:bg-[#212121]">
                                                <div className={`flex gap-3 w-full ${n.senderId._id === user?._id?'items-center':'items-start'} `}>
                                                    <Avatar className="w-11 h-11 bg-gray-300">
                                                        <AvatarImage
                                                            src={
                                                                n.senderId._id === user?._id
                                                                    ? n.receiverId?.profilePic
                                                                    : n.senderId.profilePic
                                                            }
                                                        ></AvatarImage>
                                                    </Avatar>
                                                    {
                                                        n.senderId._id === user?._id ? (
                                                            n.friendReqStatus === 'sent' ? (
                                                                <p>
                                                                    <span>You have sent a friend request to </span>
                                                                    <span className="font-semibold">{n?.receiverId.username}</span>
                                                                </p>
                                                            ) : n.friendReqStatus === 'accepted' ? (
                                                                <p>
                                                                    <span>Your friend request was accepted by </span>
                                                                    <span className="font-semibold">{n?.receiverId.username}</span>
                                                                </p>
                                                            ) : n.friendReqStatus === 'rejected' ? (
                                                                <p>
                                                                    <span>Your friend request was rejected by </span>
                                                                    <span className="font-semibold">{n?.receiverId.username}</span>
                                                                </p>
                                                            ) : null
                                                        ) : (
                                                            <div className='sm:w-full flex mb:flex-col mb:items-end justify-between items-end gap-3'>
                                                                <div>
                                                                    <p>
                                                                        <span className="font-semibold">{n.senderId.username} </span>
                                                                        <span  >  want to be your friend </span>
                                                                    </p>
                                                                    <span className='text-blue-500 text-sm' onClick={()=> navigate(`/userProfile/${n.senderId._id}`)}  >view profile</span>
                                                                </div>
                                                                <div className='flex gap-2'>
                                                                    <Button className='h-6 px-2 text-[12px] sm:h-7 sm:px-4 sm:py-0 sm:text-[14px]'  onClick={()=>acceptOrRejectHandler(n.senderId._id,'accept',n._id)} >Accept</Button>
                                                                    <Button variant='destructive' className='h-6 px-2 text-[12px] sm:h-7 sm:px-4 sm:py-0 sm:text-[14px]' onClick={()=>acceptOrRejectHandler(n.senderId._id,'reject',n._id)}   >Reject</Button>
                                                                </div>
                                                            </div>
                                                        )
                                                    }
                                                </div>
                                                {
                                                    (n.friendReqStatus==='accepted' || n.friendReqStatus==='rejected') &&
                                                    <MdDelete className='h-5 w-5 invisible hover:text-red-500 group-hover:visible' onClick={()=>deleteNotification(n._id)} ></MdDelete>
                                                }
                                                {
                                                    n.status!=='seen' && n.senderId._id !== user?._id &&
                                                    <span className='bg-blue-500 text-[12px] text-white rounded-[8px] px-2  absolute left-3 top-0 '>new</span>
                                                }
                                            </div>
                                    );
                                }
                            }
                        }   
                    )
                }
            </div>
            {
            showNotifications?.length>0 &&
             <Button className='w-full rounded-none' onClick={()=>deleteNotification('')} >Delete all notifications</Button>
            }
        </div>
    </div>
  )
}

export default Notifications

