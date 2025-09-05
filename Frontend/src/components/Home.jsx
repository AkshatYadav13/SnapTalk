import React, { useEffect } from 'react'
import Feed from './Feed'
import Rightsidebar from './Rightsidebar'
import useGetAllPosts from '@/hooks/useGetAllPosts'
import { useGetSuggestedUser } from '@/hooks/useGetSuggestedUser'
import { useGetNewMessages } from '@/hooks/useGetNewMessages'
import { useDispatch, useSelector } from 'react-redux'
import { setUser } from '@/redux/authSlice'
import { useGetGrpNewMsgs } from '@/hooks/useGetGrpNewMsgs'
import { useSocket } from '@/lib/SocketContext'


const Home = () => {
  const socket = useSocket();
  const {user} = useSelector(store=> store.auth)
  const dispatch = useDispatch()

  useGetAllPosts()
  useGetSuggestedUser()
  useGetNewMessages()
  useGetGrpNewMsgs()
  

  useEffect(()=>{
    if(!socket) return
    
    const updateFriendList = ({ action, friend }) => {
        let updatedUser;
        if (action === 'add') {
            updatedUser = { ...user, friends: [...user.friends, friend] };
        } 
        else if((action === 'remove')){
            updatedUser = { ...user, friends: user.friends.filter((f) => f._id !== friend._id) };
        }
        dispatch(setUser(updatedUser));
    };

    socket.on('grpOnlineMember',({action,groupId,userId})=>{
      const updateUser = {...user,groupJoined:user.groupJoined.map(g=>(
        g._id===groupId 
          ?{...g,onlineMembers:
            action==='push' ?
              g.onlineMembers.includes(userId)
                ?[...g?.onlineMembers] 
                :[...g?.onlineMembers,userId] 
              :g.onlineMembers.filter(uId=> uId!==userId)
          }
          :g
      ))}
      dispatch(setUser(updateUser))
    })

    socket.on('updateFriendList', updateFriendList);

  },[socket,user])

  return (
    <div className='lg:px-[5vw] flex sm:flex-row lg:gap-2 sm:gap-5  w-full flex-col gap-8 dark:bg-[#1a1a1a]'>
      <Feed></Feed>
      <Rightsidebar></Rightsidebar>
    </div>
  )
}

export default Home