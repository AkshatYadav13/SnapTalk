import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Home, LogOut, PlusSquare, Search, TrendingUp,MessageCircle,Heart, MoreHorizontal, } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import CreatePost from './CreatePost'
import { setConnected, setSelectedUser, setUser, toggleTheme } from '@/redux/authSlice'
import { Button } from './ui/button'
import BackButton from './BackButton'
import { useGetRealTimeMsg } from '@/hooks/useGetRTMsg'
import { GoSidebarCollapse } from "react-icons/go";
import { GoSidebarExpand } from "react-icons/go";
import { IoMdNotificationsOutline } from "react-icons/io";
import { IoSettingsOutline } from "react-icons/io5";
import { MdLightMode } from "react-icons/md";
import { MdDarkMode } from "react-icons/md";
import { Popover, PopoverContent,PopoverTrigger } from './ui/popover'

const Leftsidebar = () => {
    useGetRealTimeMsg()

    const navigate = useNavigate()
    const {user,theme} = useSelector(store => store.auth)
    const [open,setOpen] = useState(false)
    const dispatch = useDispatch()
    const {notifications} = useSelector(store => store.rtn)
    const [notificationOpened,setNotificationOpened] = useState(false)
    const {newMessages,grpNewMsgs} = useSelector(store=> store.chat)
    const [menuOpen,setMenuOpen] = useState(true)

    const [showSettings,setSettings] = useState(false)

    useEffect(() => {
        const handleResize = () => {
        if (window.innerWidth <= 525) {
            setMenuOpen(false);
        }
        };
        handleResize();

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, []);


    const sidebarIcon = [
        {    icon:<Home className='w-5 h-5 lg:w-6 lg:h-6' />,    text:'Home'    },
        {    icon:<Search className='w-5 h-5 lg:w-6 lg:h-6 ' ></Search>,    text:'Search'    },
        {    icon:<MessageCircle className='w-5 h-5 lg:w-6 lg:h-6 ' ></MessageCircle>,    text:'Messages'    },
        {    icon:<IoMdNotificationsOutline className='w-6 h-6 lg:w-7 lg:h-7' ></IoMdNotificationsOutline>,    text:'Notifications'    },
        {    icon:<PlusSquare className='w-5 h-5 lg:w-6 lg:h-6 '  />,    text:'Create'    },
        {    icon:(
            <Avatar className='lg:w-7 lg:h-7 bg-gray-300 w-5 h-5' >
                <AvatarImage src={user?.profilePic} />
                <AvatarFallback>CN</AvatarFallback>
            </Avatar>
        ),    text:'Profile'    },

        {    icon:<IoSettingsOutline className='w-5 h-5 lg:w-7 lg:h-7 ' />,    text:'Settings'    },
    ]


    async function logoutHandler(){
      try {
        const res = await fetch(`https://snaptalk-q73h.onrender.com/api/v1/user/logout`,{
            method:'Get',
            credentials:'include'
        })
        const data = await res.json()
        if(!res.ok){
            toast.error(data.message)
            return
        }
        if(data.success){
            dispatch(setUser(null))
            dispatch(setConnected(false))
            dispatch(setSelectedUser(''))
            navigate('/login')
            toast.success(data.message)
        }
        
      } catch (error) {
        console.log(error)
      }  
    } 

    function sidebarHandler(item){
         if(item.text==='Create'){
            setOpen(true)
        }
        else if(item.text === 'Profile'){
            navigate(`/profile/${user._id}`)
        }
        else if(item.text === 'Home'){
            navigate('/')
        }
        else if(item.text === 'Messages'){
            navigate('/chat')
        }
        else if(item.text === 'Notifications'){
            navigate('/notifications')
            if(!notificationOpened && notifications?.length>0 ){
                setNotificationOpened(!notificationOpened)
            }
        }
        else if(item.text === 'Settings'){
            setSettings(!showSettings)
        }
    }
    
    // theme
    useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
    }, [theme]);

    return (
    <div className='border-r border-gray-300 dark:bg-[#1a1a1a] dark:text-white dark:border-[#312e2e] min-h-screen' >
        <div className='flex flex-col gap-8 py-8' >
            <div className='flex flex-col justify-center gap-[13px] w-full pl-3 sm:pl-5  lg:pl-7  mb:relative mb:z-20 '>
                {
                    menuOpen ?
                    <GoSidebarCollapse  className='w-6 h-6 hover:text-red-500 lg:w-7 lg:h-7 cursor-pointer' onClick={()=>setMenuOpen(!menuOpen)} />
                    :
                    <GoSidebarExpand className='w-6 h-6 hover:text-blue-500 lg:w-7 lg:h-7 cursor-pointer' onClick={()=>setMenuOpen(!menuOpen)} />
                }
                <BackButton></BackButton>
            </div>
     
            <div  className='flex flex-col gap-3 lg:gap-5 mb:absolute mb:pt-[120px] mb:top-0 mb:h-full bg-white mb:z-10 mb:border-r mb:border-gray-300  mb:dark:border-[#312e2e]  dark:bg-[#1a1a1a] ' >
                {
                    sidebarIcon.map((item,idx)=>{
                        return(
                            <div onClick={()=> sidebarHandler(item)}   key={idx} className='relative px-3 pr-1 py-2 sm:pl-5 lg:px-6   md:text-sm lg:text-[17px] flex gap-3 items-center cursor-pointer hover:bg-gray-300  dark:hover:bg-[#212121]' >
                                {item.icon}
                                {  menuOpen && <span>{item.text}</span>  }
                                {
                                    item.text === 'Notifications' && 
                                        <div className='w-full h-full absolute' >
                                            <Button  className={`bg-red-500  hover:bg-red-500 hover:text-white text-[10px]  lg:text-[13px] p-[6px] h-[18px] rounded-full absolute left-3 top-[-6px]  ${(notificationOpened || notifications.filter(n=> n.status==='sent' || n.status==='delivered')?.length<1) && 'hidden'} `} >{notifications.filter(n=> n.status==='sent' || n.status==='delivered' )?.length}</Button>
                                        </div>
                                }
                                {
                                    item.text === 'Messages' && 
                                        <Button  className={`hover:text-white bg-red-500  hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-500 dark:text-white h-[19px] text-[13px] p-[6px] leading-none rounded-full absolute right-2 top-[-6px] ${((newMessages?.length + grpNewMsgs?.length) <1) && 'hidden'}`} >{newMessages?.length + grpNewMsgs?.length}</Button>
                                }
                                {
                                    item.text==='Settings' &&
                                    <Popover>
                                        <PopoverTrigger>
                                            <div className='w-full h-full absolute top-0 left-0'></div>
                                        </PopoverTrigger>
                                        <PopoverContent align='start' side='right' sideOffset={20}  className='p-0 w-[230px]'>
                                            <div >
                                                <h1 className='flex items-center gap-3 hover:bg-gray-200 p-3 px-4 cursor-pointer  dark:hover:bg-[#212121]'  onClick={()=> dispatch(toggleTheme())} >
                                                    {theme==='light'  ?<MdDarkMode className='w-6 h-6' ></MdDarkMode>    :<MdLightMode className='w-6 h-6' ></MdLightMode> }
                                                    {theme === 'light' ? 'Dark' :'Light'} theme
                                                </h1>

                                                <h1 className='flex items-center gap-3 hover:bg-gray-200 p-3 px-4 cursor-pointer dark:hover:bg-[#212121]' onClick={logoutHandler}>
                                                    <LogOut className='w-6 h-6' ></LogOut>
                                                    logout
                                                </h1>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                }
                            </div>
                        )   
                    })
                }
            </div>
        </div>
        <CreatePost  open={open} setOpen={setOpen}></CreatePost>

    </div>
  )
}

export default Leftsidebar

