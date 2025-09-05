import React, { useEffect, useRef, useState } from 'react'
import { AvatarFallback, AvatarImage,Avatar } from './ui/avatar'
import { IoMdArrowBack } from 'react-icons/io'
import { useGetGroupDetails } from '@/hooks/useGetGroupDetails'
import { useDispatch, useSelector } from 'react-redux'
import { LiaCheckDoubleSolid, LiaCheckSolid } from 'react-icons/lia'
import { Input } from './ui/input'
import GroupInfo from './GroupInfo'
import { formatDate } from '@/lib/utils'
import { setSelectedGroup } from '@/redux/chatSlice'
import { IoSend } from 'react-icons/io5'
import { useUpdateGrpMsgStatus } from '@/hooks/useUpdateGrpMsgStatus'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { setUser } from '@/redux/authSlice'
import { useSocket } from '@/lib/SocketContext'

const GroupMessages = ({closeChatView}) => {
  const socket = useSocket();

  const {selectedGroup} = useSelector(store=> store.chat)
  const unseenMsgCount =  useGetGroupDetails(selectedGroup._id)
  useUpdateGrpMsgStatus(selectedGroup?._id)

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [textMsg,setTextMsg] = useState('')
  const [openGrpInfo,setOpenGrpInfo] = useState(false)
  const {user,theme} = useSelector(store=> store.auth)
  const containerRef = useRef(null)
  
  const [newNotificationCount,setNewNotification] = useState(0)

  const backgroundImage = theme==='light'? `https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg` : `https://i.pinimg.com/originals/85/ec/df/85ecdf1c3611ecc9b7fa85282d9526e0.jpg`

  let msgDate = ''
    
  const isAdmin = selectedGroup?.members?.some(m=>
    m?.memberId?._id===user?._id && m?.role==='admin'
  )

  const [showMsg,setShowMsg] = useState(true)

  // api calls
  async function sendMsgHandler() {
      if(!textMsg) return
      try {
        const res = await fetch(`http://localhost:8000/api/v1/group/msg/send/${selectedGroup._id}`,{
          method:'post',
          credentials:'include',
          body:JSON.stringify({'message':textMsg}),
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
          const updatedGroup = {...selectedGroup,chat:[...selectedGroup.chat,data.grpMessage]}
          dispatch(setSelectedGroup(updatedGroup))
          setTextMsg('')
          return
        }
  
      } catch (error) {
        console.log(error)
      }
  }

 async function updateGrpNotifications() {
  try {
    const res = await fetch(`http://localhost:8000/api/v1/group/notification/status/update/${selectedGroup?._id}`,{
      method:'get',
      credentials:'include'
    })
    const data = await res.json()
    if(!res.ok){
      toast.error(data.message)
      return
    }
    if(data.success){
      setNewNotification(0)
      return
    }

  } catch (error) {
    console.log(error)
  }
 }

  // function
  function calculateMsgStatus(statusArr){
    if(statusArr.every(s=> s.status==='seen')) return 'seen'
    else if(statusArr.some(s=> s.status==='delivered') || statusArr.some(s=> s.status==='seen') ) return 'delivered'
    else return 'sent'
  }

  function updateMsgDate(date){
    if(date){
      const formatedDate = formatDate(date).split(',')[0]
      msgDate = formatedDate
    }
  }

  function toggleChatPage(){
    if(!showMsg && newNotificationCount>0){
      updateGrpNotifications()
    }
    setShowMsg(!showMsg)
  }

  function countNewNotification(){
    let count=0
    selectedGroup?.notifications?.forEach(n=>{
      if(n.status.some(u=> u.userId===user?._id && u.status==='unseen')){
        count++
      }
    })
    return count
  }


  useEffect(()=>{
    setNewNotification(countNewNotification())
    if(containerRef.current){
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }

    socket?.on('updateGrpMsgStatus',(idsArr,newStatus,userId)=>{
      const updateSelGrp = {
          ...selectedGroup,
          chat: selectedGroup.chat.map(m => {
              if (idsArr.includes(m._id)) {
                  const updatedStatus = m.status.map(s =>
                      s.userId._id === userId ? { ...s, status: newStatus } : s
                  );
                  return { ...m, status: updatedStatus };
              }
              return m; 
          }),
      };

      setTimeout(()=>{
        dispatch(setSelectedGroup(updateSelGrp))
      },300)
    })


    socket?.on('newGrpNotification',({newNotification,details})=>{
      if(newNotification){
        let updatedGrp = {...selectedGroup,notifications:[...selectedGroup?.notifications,newNotification]}
        
        if(newNotification.type==='make_admin'  || newNotification.type==='dismiss_admin'  ){
            updatedGrp = {...updatedGrp,members:
              updatedGrp.members.map(m=> 
                m.memberId._id===newNotification.user._id 
                  ? {...m,role: newNotification.type==='make_admin' ? 'admin' : 'member'} 
                  : m  
              )
            } 
        }
        else if(newNotification.type==='add'){
            updatedGrp = {...updatedGrp,members:details}
        }
        else if(newNotification.type==='remove' || newNotification.type==='leave' ){
            if(user._id===newNotification.user._id){
              updatedGrp = ''
              const updatedUser = {...user,groupJoined:user.groupJoined.filter(g=> g._id!==details)}
              dispatch(setUser(updatedUser))
            }else{
              updatedGrp = {...updatedGrp,members:updatedGrp.members.filter(m=> m.memberId._id!==newNotification.user._id)}
            }
        }
        else if(newNotification.type==='edit_grp'){
            updatedGrp = {...updatedGrp,groupPermissions:{...updatedGrp.groupPermissions,
              edit_grp_setting:updatedGrp.groupPermissions.edit_grp_setting==='on'?'off':'on'}
            }
        }
        else if(newNotification.type==='send_msg'){
            updatedGrp = {...updatedGrp,groupPermissions:{...updatedGrp.groupPermissions,
              send_msg:updatedGrp.groupPermissions.send_msg==='on'?'off':'on'}
            }
        }
        else if(newNotification.type==='add_members'){
            updatedGrp = {...updatedGrp,groupPermissions:{...updatedGrp.groupPermissions,
              add_members:updatedGrp.groupPermissions.add_members==='on'?'off':'on'}
            }
        }
        else if(newNotification.type==='name' || newNotification.type==='description' || newNotification.type==='icon'){
            updatedGrp = {...updatedGrp,
              ...(newNotification.type==='name' && {name:details}),
              ...(newNotification.type==='description' && {description:details}),
              ...(newNotification.type==='icon' && {icon:details})
            }
        }
        dispatch(setSelectedGroup(updatedGrp))
      }
    })

    return(()=>{
      socket?.off('updateGrpMsgStatus')
      socket?.off('newGrpNotification')
    })

  },[selectedGroup])


  return (
        <div>
          {
            !openGrpInfo 
            ?
              <div className='flex flex-col' >
                  
                  <div className='flex gap-1 items-center border-b border-b-1 px-2 dark:border-[#312e2e]'>
                      <IoMdArrowBack className='w-6 h-6 cursor-pointer' onClick={closeChatView} ></IoMdArrowBack>
                      <div className='cursor-pointer flex gap-4 items-center px-4 pt-[24px] pb-[12px] w-full' onClick={()=> setOpenGrpInfo(true)} >
                          <Avatar className='w-12 h-12' >
                              <AvatarImage src={selectedGroup?.icon} />
                              <AvatarFallback>CN</AvatarFallback>
                          </Avatar>
                          <div>
                              <h1 className='text-[17px] font-medium'>{selectedGroup?.name}</h1>
              
                                <p className='text-gray-600 text-sm'>
                                  {
                                    selectedGroup?.groupPermissions?.send_msg === 'off' 
                                    ?'only admins can send messages'
                                    :'tab here to see group info'
                                  }
                                </p>
                          </div>
                      </div>
                      <Popover>
                            <PopoverTrigger>
                                <MoreVertical className='cursor-pointer'></MoreVertical>
                            </PopoverTrigger>
                            <PopoverContent className='p-0 w-[200px]'>
                            <div >
                                {
                                    (selectedGroup?.groupPermissions?.edit_grp_settings === 'on' || isAdmin) &&
                                    <h1 className='hover:bg-gray-200 p-2 px-3 cursor-pointer dark:hover:bg-[#212121]' onClick={()=> navigate(`/group/edit/${selectedGroup._id}`)} >Edit group </h1>
                                }
                                  <div  onClick={toggleChatPage}  className='flex items-center justify-between pr-4  hover:bg-gray-200 p-2 px-3 cursor-pointer dark:hover:bg-[#212121]'>
                                    <h1  >{showMsg ? 'Notifications' : 'Messages'}</h1>
                                    {
                                      (showMsg && newNotificationCount>0 )&&<span className='bg-red-500 px-[5px] text-white rounded-full text-[12px]' >{newNotificationCount}</span>
                                    }
                                  </div>
                            </div>
                            </PopoverContent>
                      </Popover>
                  </div>

                  <div ref={containerRef}  className='dark:text-black pt-1 h-[79vh] pb-4 flex pl-4 px-3 flex-col gap-4 custom-scrollbar overflow-auto items-baseline' style={{backgroundImage:`url(${backgroundImage})`}}>
                      {
                        showMsg ?
                          selectedGroup?.chat?.map((m,idx)=>
                              <div key={idx} className={`w-full flex flex-col gap-2`}>
                                  {
                                    (!msgDate || msgDate!=formatDate(m.createdAt).split(',')[0]) &&
                                    <div className='flex items-center justify-center w-full'>
                                      <div className="text-center text-gray-500 font-medium my-2 bg-white px-3 rounded-[10px] dark:bg-[#272727] ">{formatDate(m.createdAt).split(',')[0]}</div>
                                    </div>
                                  }
                                  {
                                      (selectedGroup?.chat?.length-idx) === unseenMsgCount &&
                                      <div  className=' text-center my-3'>
                                          <span className='bg-white px-3 py-1 rounded-[10px] text-sm'>{unseenMsgCount} new messages</span>
                                      </div>
                                  }
                                  {/* Date */}

                                  <div  className={`flex gap-2 ${m.senderId?._id===user?._id && 'ml-auto'}`}>
                                      {
                                        m.senderId?._id!==user?._id && 
                                          <Avatar className='w-8 h-8 bg-gray-300' >
                                              <AvatarImage src={m?.senderId?.profilePic} />
                                              <AvatarFallback>CN</AvatarFallback>
                                          </Avatar>
                                      }

                                      <div className={`min-w-[140px] flex flex-col pb-7 justify-between gap-1 relative  px-3 rounded-[12px] text-[16px]  max-w-[25vw] ${m.senderId?._id===user._id ? 'bg-[#B4E380] ' : 'bg-gray-200' } `}>
                                          {
                                            m.senderId?._id!==user._id && 
                                            <span className='text-blue-600 text-[13px]' >{m.senderId?.username}</span>
                                          }
                                            <span className='py-[2px]' >{m.message}</span>
                                            
                                          { m.senderId?._id===user._id &&(
                                                calculateMsgStatus(m.status)==='sent' ?
                                                <LiaCheckSolid className='text-gray-500  absolute bottom-1 right-3' ></LiaCheckSolid>
                                                :
                                                <LiaCheckDoubleSolid className={`absolute bottom-1 right-3 ${calculateMsgStatus(m.status)==='seen' ? 'text-cyan-500' : 'text-gray-500' }`} />
                                            )
                                          }
      
                                          <span className='absolute bottom-1 left-3 text-[12px] text-gray-600'>{formatDate(m.createdAt).split(',')[1]}</span>
                                      </div>
                                  </div>  
                                  {updateMsgDate(m.createdAt)}
                              </div>
                          )
                        :
                        <div className='w-full h-full flex flex-col items-center justify-end'>
                          {
                              selectedGroup?.notifications.length <1 ?
                              <p className='bg-white px-3 py-1 rounded-[10px] text-sm my-3' >no new notifications</p>
                            :
                            selectedGroup?.notifications.map((n,idx)=>(
                                <div  key={idx} className='flex flex-col items-center'>
                                  {
                                    (selectedGroup?.notifications.length-idx === newNotificationCount) && <p className='bg-white px-3 py-1 rounded-[10px] text-sm my-3' >{newNotificationCount} new notifications</p>
                                  }
                                  
                                  <span  className='bg-[#FFE893] my-2 text-gray-900 text-center text-sm px-5 py-1 rounded-[15px]  lg:text-[16px]' >
                                    {
                                      n.type==='create_grp'?
                                        n.author._id === user?._id ? `you created this group` :`${n.author.username} created this group`
                                      :
                                      n.type==='add' ?
                                        n.author._id === user?._id ?` you added ${n.user.username}`: n.user._id === user?._id ? `${n.author.username} added you`  :`${n.author.username} added ${n.user.username}` 
                                      :
                                      n.type==='remove' ?
                                        n.author._id === user?._id ?` you removed ${n.user.username}` :`${n.author.username} removed ${n.user.username}` 
                                      :
                                      n.type==='leave'?
                                        `${n.user.username} left the group`
                                      :
                                      n.type==='icon'?
                                      `${n.author._id === user?._id ? `you`:`${n.author.username}`}  changed this group's icon`
                                      :
                                      n.type==='name'?
                                      `${n.author._id === user?._id ? `you`:`${n.author.username}`}  changed this group's name`
                                      :
                                      n.type==='description'?
                                        `${n.author._id === user?._id ? `you`:`${n.author.username}`}  changed this group's description`
                                      :
                                      n.type==='edit_grp'?
                                        `${n.author._id === user?._id?'you':`${n?.author?.username}`} changed the settings so ${selectedGroup?.groupPermissions?.edit_grp_setting==='off'?`only admins can`:`all members can`} edit the group settings` 
                                      :
                                      n.type==='send_msg'?
                                        `${n.author._id === user?._id?'you':`${n?.author?.username}`} changed the settings so ${selectedGroup?.groupPermissions?.send_msg==='off'?`only admins can`:`all members can`} send messages in this group` 
                                      :
                                      n.type==='add_members'?
                                        `${n.author._id === user?._id?'you':`${n?.author?.username}`} changed the settings so ${selectedGroup?.groupPermissions?.add_members==='off'?`only admins can`:`all members can`} add other members in this group` 
                                      :
                                      n.type==='make_admin' ?
                                        n.author._id === user?._id ?` you made ${n.user.username} an admin`: n.user._id === user?._id ? `${n.author.username} made you an admin`  : `${n.author.username} made ${n.user.username} an admin`
                                      :
                                      n.type==='dismiss_admin' ?
                                        n.author._id === user?._id ?` you dismissd ${n.user.username} as admin`: n.user._id === user?._id ? `${n.author.username} dismissed you as admin`  : `${n.author.username} dismissed ${n.user.username} as admin`
                                      :``
                                    }
                                  </span>
                                </div>
                            ))
                          }
                        </div>
                      }
                  </div>

                  <div className='bg-white items-center dark:bg-[#1a1a1a]'>
                      {
                        selectedGroup?.groupPermissions?.send_msg === 'off' && !isAdmin

                        ?<div className='pt-2 w-full h-full text-center'>
                            <p>Only<span className='text-green-500' > admins </span>can send messages</p>
                        </div>
                        :<div className='relative flex items-center mx-5 lg:mx-6'>
                              <Input 
                                  value={textMsg} 
                                  onChange={(e)=> setTextMsg(e.target.value)}  
                                  type='text' className='border-[1px] border-gray-400 rounded-[10px] focus-visible:ring-transparent pr-10' placeholder='Start Messaging...'
                                  onKeyDown={(e)=>{
                                    e.key === 'Enter' && sendMsgHandler()
                                  }}
                                  />
                              {  
                                  textMsg && <IoSend className='absolute right-2  w-5 h-5 cursor-pointer z-10' onClick={sendMsgHandler} ></IoSend>         
                              }
                          </div>
                      }
                  </div>
              </div>
            :
            <GroupInfo setOpenGrpInfo={setOpenGrpInfo} closeChatView={closeChatView} ></GroupInfo>
          }

        </div>

  )
}

export default GroupMessages