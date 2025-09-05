import React, { useEffect, useState } from 'react'
import { MoreVertical } from 'lucide-react'
import { RxExit } from "react-icons/rx";
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { IoIosArrowDown } from "react-icons/io";
import { IoSettingsOutline } from 'react-icons/io5'
import { useDispatch, useSelector } from 'react-redux';
import { IoMdArrowBack } from 'react-icons/io'
import { AvatarFallback, AvatarImage,Avatar } from './ui/avatar'
import { formatDate } from '@/lib/utils';
import { RiDeleteBin6Line } from "react-icons/ri";
import { Link, useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { MdOutlineDone } from "react-icons/md";
import { toast } from 'sonner';
import { setSelectedGroup } from '@/redux/chatSlice';
import { CiEdit } from "react-icons/ci";
import { BsChatRightText } from "react-icons/bs";
import { IoPersonAddOutline } from "react-icons/io5";
import { setUser } from '@/redux/authSlice';
import Notifications from './Notifications';

const GroupInfo = ({setOpenGrpInfo,closeChatView}) => {
    const navigate = useNavigate()
    const dispatch = useDispatch()

    const {user} = useSelector(store=> store?.auth)
    const {selectedGroup} = useSelector(store=> store?.chat)
    const [addDialogOpen,setAddDialogOpen] = useState(false)
    const [permissionDialogOpen,setPermissionDialogOpen] = useState(false)
    const [onlineMembers,setOnlineMembers] = useState([])


    const isAdmin = selectedGroup?.members?.some(m=>
        m?.memberId?._id===user._id && m?.role==='admin'
    )

    // add member
    const [inputEmail,setInputEmail] = useState('')


    // grp permissions
    const [grpPermissions,setGrpPermissions] = useState({
        'edit_grp_setting':selectedGroup?.groupPermissions?.edit_grp_setting,
        'send_msg':selectedGroup?.groupPermissions?.send_msg,
        'add_members':selectedGroup?.groupPermissions?.add_members,
    })
    const [save,setSave] = useState(false)

    function handleCheckboxChange(e){
        if(isAdmin){
            setGrpPermissions({...grpPermissions,[e.target.name]:e.target.checked?'on':'off'})
            setSave(true)
        }
    }

    function handleDialogToggle(isOpen){
        setPermissionDialogOpen(isOpen)
        if(!isOpen){
            setGrpPermissions({
                'edit_grp_setting':selectedGroup?.groupPermissions?.edit_grp_setting,
                'send_msg':selectedGroup?.groupPermissions?.send_msg,
                'add_members':selectedGroup?.groupPermissions?.add_members,
            })
            setSave(false)
        }
    }

    // api calls
    async function addMemberHandler() {
        try {
            const res = await fetch(`http://localhost:8000/api/v1/group/addMember/${selectedGroup._id}`,{
                method:'post',
                credentials:'include',
                body:JSON.stringify({'userEmail':inputEmail}),
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
                const updatedSelGrp = {...selectedGroup,
                    members:data.grpMembers,
                    notifications:[...selectedGroup?.notifications,data.newNotification]
                }
                dispatch(setSelectedGroup(updatedSelGrp))
                setAddDialogOpen(false)
                return
            }

        } catch (error) {
            console.log(error)
        }
    }

    async function removeMemberHandler(userId) {
        try {
            const res = await fetch(`http://localhost:8000/api/v1/group/removeMember/${selectedGroup._id}/${userId}`,{
                method:'get',
                credentials:'include',
            })
            const data = await res.json()
            if(!res.ok){
                toast.error(data.message)
                return
            }
            if(data.success){
                toast.success(data.message)
                const updatedSelGrp = {...selectedGroup,
                    members:selectedGroup.members.filter(m=> m.memberId._id!=userId),
                    notifications:[...selectedGroup?.notifications,data.newNotification]
                }
                dispatch(setSelectedGroup(updatedSelGrp))
                return
            }

        } catch (error) {
            console.log(error)
        }
    }

    async function toggleAdminStatus(userId) {
        try {
            const res = await fetch(`http://localhost:8000/api/v1/group/admin/toggle/${selectedGroup._id}/${userId}`,{
                method:'get',
                credentials:'include',
            })
            const data = await res.json()
            if(!res.ok){
                toast.error(data.message)
                return
            }
            if(data.success){
                toast.success(data.message)
                const updatedSelGrp = {...selectedGroup,
                    members:
                    selectedGroup.members.map(m=> 
                        m.memberId._id===userId?
                        {...m,role:m.role==='member'?'admin':'member'}
                        :m
                    ),
                    notifications:[...selectedGroup?.notifications,data.newNotification]
                    
                }
                dispatch(setSelectedGroup(updatedSelGrp))
                return
            }

        } catch (error) {
            console.log(error)
        }
    }

    async function permissionSubmitHandler() {
        let input ={}
        if(selectedGroup.groupPermissions.edit_grp_setting!==grpPermissions.edit_grp_setting){
            input['edit_grp_setting'] = grpPermissions.edit_grp_setting
        }
        if(selectedGroup.groupPermissions.send_msg!==grpPermissions.send_msg){
            input['send_msg'] = grpPermissions.send_msg 
        }        
        if(selectedGroup.groupPermissions.add_members!==grpPermissions.add_members){
            input['add_members'] = grpPermissions.add_members
        }

        try {
            const res = await fetch(`http://localhost:8000/api/v1/group/grpPermissions/change/${selectedGroup._id}`,{
                method:'post',
                credentials:'include',
                headers: {
                    'Content-Type': 'application/json', 
                },    
                body:JSON.stringify(input),
            })
            const data = await res.json()

            if(!res.ok){
                toast.error(data.message)
                return
            }
            if(data.success){
                toast.success(data.message)
                const updatedSelGrp = {...selectedGroup,
                    groupPermissions:data.updatedPermissions,
                    notifications:[...selectedGroup?.notifications,...data.notificationArr]
                }
                dispatch(setSelectedGroup(updatedSelGrp))
                setSave(false)
                return
            }
        } catch (error) {
            console.log(error)
        }
    }

    async function leaveGroupHandler() {
        try {
            const res = await fetch(`http://localhost:8000/api/v1/group/leave/${selectedGroup._id}`,{
                method:'get',
                credentials:'include',
            })
            const data = await res.json()
            if(!res.ok){
                toast.error(data.message)
                return
            }
            if(data.success){
                toast.success(data.message)
                const updatedUser = {...user,groupJoined:
                    user.groupJoined.filter(g=> g._id!==selectedGroup._id)
                }

                dispatch(setUser(updatedUser))
                closeChatView()
                return
            }

        } catch (error) {
            console.log(error)
        }
    }

    async function deleteGroupHandler() {
        try {
            const res = await fetch(`http://localhost:8000/api/v1/group/delete/${selectedGroup._id}`,{
                method:'get',
                credentials:'include',
            })
            const data = await res.json()
            if(!res.ok){
                toast.error(data.message)
                return
            }
            if(data.success){
                toast.success(data.message)
                const updatedUser = {...user,groupJoined:
                    user.groupJoined.filter(g=> g._id!==selectedGroup._id)
                }

                dispatch(setUser(updatedUser))
                closeChatView()
                return
            }

        } catch (error) {
            console.log(error)
        }
    }

    useEffect(()=>{
        const group = user?.groupJoined.find(g=> g._id===selectedGroup?._id)
        if(group){
            setOnlineMembers(group.onlineMembers)
        }

    },[user,selectedGroup])


  return (
    <div className='pb-10 h-[100vh] scroll-smooth scrollbar-hidden overflow-y-scroll custom-scrollbar'>
        <div className='mb:pl-6 flex w-full pt-4 justify-between items-start pl-2 pr-5'>
            <IoMdArrowBack className='w-6 h-6 mt-4 cursor-pointer' onClick={()=>setOpenGrpInfo(false)} ></IoMdArrowBack>
            <div className='flex flex-col gap-3 items-center w-full'>
                <Avatar className='w-28 h-28' >
                    <AvatarImage src={selectedGroup?.icon} />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className='flex flex-col items-center justify-center'>
                    <h1 className='text-[20px] mb-1'>{selectedGroup?.name}</h1>
                    <p className='text-gray-500'>Group of {selectedGroup?.members?.length} members</p>
                </div>
            </div>
            <Popover>
                <PopoverTrigger>
                    <MoreVertical className='cursor-pointer mt-4' ></MoreVertical>
                </PopoverTrigger>
                <PopoverContent className='p-0 w-[200px]'>
                <div className=''>
                    {/* user id or email */}
                    {
                        (selectedGroup?.groupPermissions?.add_members === 'on' || isAdmin) &&
                        <h1 className='hover:bg-gray-200 p-2 px-3 cursor-pointer dark:hover:bg-[#212121]' onClick={()=> setAddDialogOpen(!addDialogOpen)} >Add members</h1>
                    }   
                    {
                        (selectedGroup?.groupPermissions?.edit_grp_settings === 'on' || isAdmin) &&
                        <h1 className='hover:bg-gray-200 p-2 px-3 cursor-pointer dark:hover:bg-[#212121]' onClick={()=> navigate(`/group/edit/${selectedGroup._id}`)} >Edit group </h1>
                    }
                    <h1 className='hover:bg-gray-200 p-2 px-3 cursor-pointer dark:hover:bg-[#212121]' onClick={()=> setPermissionDialogOpen(!permissionDialogOpen)}  >Group permissions</h1>
                </div>
                </PopoverContent>
            </Popover>
        </div>

        <div className='mb:pl-6 py-2 border-t border-b-1 gap-2 mt-[27.5px] min-h-[66px] flex flex-col justify-center pl-4 dark:border-[#312e2e]'>
            {
                selectedGroup.description ?
                <p className='text-[18px]'>{selectedGroup.description}</p>
                :
                isAdmin ? <p className='text-[17px] text-emerald-500 cursor-pointer'>Add group description</p>
                        : <p className='text-[18px] text-sm text-gray-500'>no description yet..</p>
            }
            <p className='text-gray-500 text-sm' >
                 Created by {selectedGroup?.createdBy?._id===user?._id 
                 ?' you ':
                 <Link className='hover:text-blue-500'  to={`/profile/${selectedGroup?.createdBy?._id}`} >{selectedGroup?.createdBy?.username}</Link>} , {formatDate(selectedGroup?.createdAt)}
            </p>

        </div>

        <div className='mb:pl-6 mt-3 pl-4 py-3 flex items-end gap-5 cursor-pointer mb:bg-gray-100 hover:bg-gray-200 dark:hover:bg-[#212121]' onClick={()=> setPermissionDialogOpen(!permissionDialogOpen)} >
            <IoSettingsOutline className='w-7 h-7'></IoSettingsOutline>
            <p className='text-[18px]'>Group Permissions</p>
        </div>

        <div className='my-12'>
            <p className='mb:pl-6 pl-4 my-1 text-gray-500' >{selectedGroup?.members?.length} members</p>
            <div className='max-h-[240px] overflow-y-scroll custom-scrollbar'>
                {
                    selectedGroup?.members?.map((u)=>
                        <div key={u?.memberId._id}  className='group py-[10px] mb:pl-6 px-4 pr-6 relative flex items-start justify-between   border-b border-b-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#212121] dark:border-[#312e2e]'>
                            <div className='flex gap-4 '>
                                <Avatar className='w-10 h-10  bg-gray-300' >
                                    <AvatarImage src={u?.memberId?.profilePic} />
                                    <AvatarFallback>CN</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h1 className='text-[16px]  text-nowrap mb:text-sm'>{u?.memberId?._id===user._id?'You': u?.memberId?.username}</h1>
                                    <span className={`text-sm font-medium ${onlineMembers?.includes(u?.memberId?._id)? 'text-green-500':'text-red-500'} `} >{ onlineMembers?.includes(u?.memberId?._id) ? 'Online' : 'Offline'}</span>
                                </div>
                            </div>
                            {
                                u.role==='admin' &&
                                <p className='bg-green-400 text-gray-800 py-[2px] px-3 rounded-[9px] text-[13px]' >Group Admin</p>
                            }
                            {
                                u?.memberId?._id!==user._id &&
                                    <Popover>
                                    <PopoverTrigger className='absolute bottom-0 right-7'>
                                        <IoIosArrowDown className='invisible group-hover:visible '></IoIosArrowDown>
                                    </PopoverTrigger>
                                    <PopoverContent align='end' className='p-0 w-[200px]'>
                                        <div>
                                            <h1 className='hover:bg-gray-200 p-2 px-3 cursor-pointer dark:hover:bg-[#212121]' onClick={()=> navigate(`/profile/${u?.memberId?._id}`)} >view profile</h1>
                                            {isAdmin &&
                                                <>
                                                    <h1 className='hover:bg-gray-200 p-2 px-3 cursor-pointer dark:hover:bg-[#212121]'  onClick={()=> toggleAdminStatus(u?.memberId?._id)}  >{u.role==='member'? 'Grant admin role' : 'Dismiss as admin'}</h1>
                                                    <h1 className='hover:bg-red-200 p-2 px-3 cursor-pointer dark:hover:bg-red-500'  onClick={()=> removeMemberHandler(u?.memberId?._id)} >Remove</h1>
                                                </>
                                            }
                                        </div>
                                    </PopoverContent>
                                    </Popover>
                            }
                        </div>
                    )
                }
            </div>
        </div>

        <div className='pl-6 cursor-pointer w-full hover:bg-red-200 group py-2 group  dark:hover:bg-red-500 ' >
            {
                selectedGroup.members.length===1 
                ?
                <div className='flex items-center gap-4' onClick={deleteGroupHandler} >
                    <RiDeleteBin6Line className='w-7 h-7  text-red-600 dark:group-hover:text-white' ></RiDeleteBin6Line>
                    <span className='text-[18px] text-red-600 dark:group-hover:text-white'>Delete group</span>
                </div>
                :
                <div className='flex items-center gap-4 ' onClick={leaveGroupHandler}>
                    <RxExit className='w-7 h-7  text-red-600 dark:group-hover:text-white'></RxExit>
                    <span className='text-[18px] text-red-600 dark:group-hover:text-white' >Leave group</span>
                </div>
            }
        </div>




        <Dialog onOpenChange={setAddDialogOpen} open={addDialogOpen}>
            <DialogContent className='py-4 min-h-[200px]'>
                <div >
                    <h1 className='mb-5 text-[22px] text-green-600'>Add Members</h1>
                    <Input value={inputEmail} onChange={(e)=> setInputEmail(e.target.value)}  type='text' placeholder='Enter email id of member' className='focus-visible:ring-transparent'></Input>

                    <div className='flex justify-end mt-8'>
                        {
                            inputEmail && <Button className=' bg-green-500 rounded-[5px]' onClick={addMemberHandler} ><MdOutlineDone></MdOutlineDone></Button>  
                        }
                    </div>
                </div>
            </DialogContent>
        </Dialog>

        <Dialog onOpenChange={handleDialogToggle} open={permissionDialogOpen}>
            <DialogContent className='px-0'>
                <div>
                    <span className='px-5'>Members can:</span>
                    <div className='flex flex-col my-3'>

                        <div className='flex items-center justify-between p-4  hover:bg-gray-200 cursor-pointer dark:hover:bg-[#212121]'>
                            <div className='flex items-center gap-5'>
                                <CiEdit className='w-7 h-7'></CiEdit>
                                <div>
                                    <h1>Edit group settings</h1>
                                    <span className='text-[13px] text-gray-600'>This includes the name,icon,description</span>
                                </div>
                            </div>
                            
                            <label className="switch">
                                <input type="checkbox" name='edit_grp_setting' checked={grpPermissions?.edit_grp_setting==='off'?false:true} onChange={handleCheckboxChange}></input>
                                <span className="slider round"></span>
                            </label>              
                        </div>
                        <div className='flex items-center justify-between p-4  hover:bg-gray-200 cursor-pointer dark:hover:bg-[#212121]'>
                            <div className='flex items-center gap-5'>
                                <BsChatRightText className='w-6 h-6' ></BsChatRightText>
                                <div>
                                    <h1>Send messages</h1>
                                </div>
                            </div>
                            
                            <label className="switch">
                                <input type="checkbox" name='send_msg' checked={grpPermissions?.send_msg==='off'?false:true} onChange={handleCheckboxChange} ></input>
                                <span className="slider round"></span>
                            </label>              
                        </div>
                        <div className='flex items-center justify-between p-4  hover:bg-gray-200 cursor-pointer dark:hover:bg-[#212121]'>
                            <div className='flex items-center gap-5'>
                                <IoPersonAddOutline className='w-6 h-6' ></IoPersonAddOutline>
                                <div>
                                    <h1>Add other members</h1>
                                </div>
                            </div>
                            
                            <label className="switch">
                                <input type="checkbox" name='add_members' checked={grpPermissions?.add_members==='off'?false:true}  onChange={handleCheckboxChange} ></input>
                                <span className="slider round"></span>
                            </label>              
                        </div>
                    </div>

                    <div className='flex justify-end px-4 mt-9 h-10'>
                        {
                            save && <Button onClick={permissionSubmitHandler}  className=' bg-green-500 rounded-[5px]' ><MdOutlineDone></MdOutlineDone></Button>  
                        }
                    </div>
                    {
                        !isAdmin && <div className='text-gray-700 text-center text-[14px]'>only admins can change group permissions</div>
                    }
                </div>
            </DialogContent>
        </Dialog>
    </div>
)
}

export default GroupInfo