import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback,AvatarImage } from "./ui/avatar";
import { useGetUserProfile } from "@/hooks/useGetUserProfile";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Heart, MessageCircle, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { setUser, setUserProfile } from "@/redux/authSlice";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { MdOutlineArrowForwardIos } from "react-icons/md";
import { useSocket } from "@/lib/SocketContext";
import { debounce } from "@/lib/utils";


const Profile = () => {
  const params = useParams()
  const userId = params.id

  useGetUserProfile(userId)

  const {user,userProfile} = useSelector(store => store.auth)
  const isClientProfile = user?._id === userProfile?._id ? true : false
  const isFollowing = user?.following.map(u=> u?._id).includes(userProfile?._id)
  const [activeTab,setActiveTab] = useState('posts')
  const [displayPosts,setDisplayPosts] = useState([])
  const [mobView,setMobView] = useState(window.innerWidth <= 525 ? true :false) 
  const [isFriend,setIsFriend] = useState(user?.friends?.map(f=>f._id).includes(userProfile?._id))
  const socket = useSocket();
  
  useEffect(()=>{
      setIsFriend(user?.friends?.map(f=>f._id).includes(userProfile?._id))
  },[user,userProfile])
  
  const [isFriendDialogOpen,setFriendDialogOpen] = useState(false)
  const [isFollowerDialogOpen,setFollowerDialogOpen] = useState(false)
  const [isFollowingDialogOpen,setFollowingDialogOpen] = useState(false)

  const dispatch = useDispatch()

  useEffect(() => {
      const handleResize = () => {
      if (window.innerWidth <= 525) {
        setMobView(true)
      }
      else{
        setMobView(false)
      }
      };
      handleResize();

      window.addEventListener('resize',debounce(handleResize,500));
      return () => window.removeEventListener('resize', handleResize);
  }, []);


  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  useEffect(()=>{
    if(userId === userProfile?._id){
      if(activeTab === 'posts'){
        setDisplayPosts( userProfile?.posts)
      }
      else if(activeTab === 'saved'){
        setDisplayPosts(userProfile?.bookmarks)
      }
      else{
        setDisplayPosts([])
      }
    }
  },[activeTab,userProfile])


  async function followUnfollowHandler() {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/user/followOrUnfollow/${userProfile?._id}`,{
        method:'get',
        credentials:'include'
      })
      const data = await res.json()
      if(!res.ok){
        toast.error(data.message)
        return
      }

      if(data.success){
        toast.success(data.message)
        let updatedUser
        if(data.type==='follow'){
            updatedUser = {...user,following:user.following.map(u=>u?._id).includes(data.user?._id) ? [...user.following] : [...user.following,data.user] }
        }
        else if(data.type==='unfollow'){
            updatedUser = {...user,following: user.following.filter(u=>u?._id!=data.user?._id)}
        }
        if(updatedUser){
          dispatch(setUser(updatedUser))
          if(data.type==='follow'){
            updatedUser = {...userProfile,followers: userProfile.followers.map(u=>u?._id).includes(user?._id)? [...userProfile.followers] :[...userProfile.followers,user]}
          }
          else if(data.type==='unfollow'){
            updatedUser = {...userProfile,followers: userProfile.followers.filter(u=>u._id!=user._id)}
          }
          dispatch(setUserProfile(updatedUser))
        }
        return
      }

    } catch (error) {
      console.log(error)
    }
  }

  async function sendFriendRequest() {
    try {
        const res = await fetch(`http://localhost:8000/api/v1/notification/friendReq/send/${userProfile?._id}`,{
          method:'get',
          credentials:'include'
        })
        const data = await res.json()

        if(!res.ok){
          toast.error(data.message)
          return
        }
        if(data.success){
          toast.success(data.message)
          return
        }

    } catch (error) {
      console.log(error)
    }
  }

  async function removeFriend() {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/notification/friend/remove/${userProfile._id}`,{
        method:'get',
        credentials:'include'
      })
      const data = await res.json()

      if(!res.ok){
        toast.error(data.message)
        return
      }
      if(data.success){
        toast.success(data.message)
        let  updatedUser =  {...user,friends:user.friends.filter(f=> f._id!==data.userId)}
        dispatch(setUser(updatedUser))
        let updatedUserProfile = {...userProfile,friends:userProfile.friends.filter(f=> f._id!==data.clientId)}
        dispatch(setUserProfile(updatedUserProfile))
        return
      }

    } catch (error) {
      console.log(error)
    }
  }

  useEffect(()=>{
    const handleUpdateProfile = (client,userId,type)=>{
      let updatedUser
      if(user?._id===userId && userProfile?._id===userId){
          if(type==='follow'){
            updatedUser = {...user,followers: user.followers.includes(client) ? [...user.followers] :  [...user.followers,client]}
          }
          else if(type==='unfollow'){
              updatedUser = {...user,followers: user.followers.filter(u=>u._id!=client._id)}
          }
          if(updatedUser){  
            dispatch(setUser(updatedUser))
            dispatch(setUserProfile(updatedUser))    
          }
      }
      else if(user?._id!==userId && userProfile?._id===userId){
          if(type==='follow'){
            updatedUser = {...userProfile,followers: userProfile.followers.includes(client) ? [...userProfile.followers] :  [...userProfile.followers,client]}
          }
          else if(type==='unfollow'){
              updatedUser = {...userProfile,followers: userProfile.followers.filter(u=>u._id!=client._id)}
          }
          if(updatedUser){  
            dispatch(setUserProfile(updatedUser))    
          }
      }
    }

    socket?.on('updateProfile',handleUpdateProfile)

    return(()=>{
      socket?.off('updateProfile',handleUpdateProfile)
    })

  },[user,userProfile])


  return (
    userProfile &&
    <div className="w-full min-h-[100vh] py-24 px-5 sm:px-12 lg:px-24 dark:bg-[#1a1a1a] dark:text-white">
      <div className="flex gap-6 sm:gap-10 items-start">
          <div className="flex gap-3 items-center">
            <Avatar className="w-36 h-36 md:w-48 md:h-48  bg-gray-300">
              <AvatarImage src={userProfile?.profilePic} />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>

          <div className="flex flex-col gap-3 gap-y-4 lg:gap-6">
            <div className="flex flex-wrap gap-y-1 gap-x-6 items-center md:justify-between">
              <h1 className="text-[1.3rem] lg:text-[1.5rem] text-nowrap">{userProfile?.username}</h1>

                  {
                    isClientProfile?
                      <Link to='/edit'>
                          <Button className='mb:h-6 mb:px-2 mb:text-[12px] h-9 px-4 py-0 text-[15px]'>Edit profile</Button>
                      </Link>
                    :
                      <Dialog>
                        <DialogTrigger asChild>
                            <MoreVertical className='cursor-pointer' ></MoreVertical>
                        </DialogTrigger>
                        <DialogContent>
                            <div className="flex flex-col gap-4 items-center">
                                {
                                  <>
                                    {
                                      isFollowing
                                        ? 
                                        <>
                                          <Button className='min-w-[220px] h-8 px-3 text-[12px] sm:h-9 sm:px-4 sm:py-0 sm:text-[15px]' onClick={followUnfollowHandler} >Unfollow</Button>
                                        </>
                                        : <Button className='min-w-[220px] h-8 px-3 text-[12px] sm:h-9 sm:px-4 sm:py-0 sm:text-[15px]' onClick={followUnfollowHandler}>Follow</Button>
                                    }
                                    {
                                      isFriend?
                                      <>
                                      <Button className='min-w-[220px] h-8 px-3 text-[12px] sm:h-9 sm:px-4 sm:py-0 sm:text-[15px]' >Message</Button>
                                      <Button variant='destructive' className='min-w-[220px] h-8 px-3 text-[12px] sm:h-9 sm:px-4 sm:py-0 sm:text-[15px]' onClick={removeFriend} >Remove from friend list</Button>
                                      </>
                                      :
                                      <Button className='min-w-[220px] h-8 px-3 text-[12px] sm:h-9 sm:px-4 sm:py-0 sm:text-[15px]' onClick={sendFriendRequest} >send friend request</Button>
                                    } 
                                  </>
                                }
                            </div>
                        </DialogContent>
                      </Dialog>
                  }

            </div>

            <div className="flex flex-wrap gap-x-5 md:gap-x-12 font-semibold text-[16px] mb-4 sm:text-[20px] lg:text-[27px]">
                <span >{userProfile?.posts?.length} <span className="cursor-pointer font-normal text-[15px] md:text-[18px] text-gray-700 dark:text-white">posts</span></span>

                <Dialog open={userProfile?.friends.length && isFriendDialogOpen} onOpenChange={setFriendDialogOpen} >
                  <DialogTrigger asChild>
                      <span onClick={()=> setFriendDialogOpen(true)} >{userProfile?.friends?.length} <span className="cursor-pointer font-normal text-[15px] md:text-[18px] text-gray-700 dark:text-white">friends</span></span>
                  </DialogTrigger>
                  <DialogContent className='p-0 overflow-hidden border-none'>
                    <h1 className="px-5 py-3 bg-blue-500 text-white" > 
                      {
                        userProfile?._id===user?._id
                        ?<span>Your Friend List</span>
                        :<span>{userProfile?.username}'s Friend List</span>
                      }
                    </h1>
                    <div className="flex flex-col">
                        {
                          userProfile?.friends.map((u)=>(
                          <Link key={u?._id} to={`/userProfile/${u?._id}`}   onClick={()=> setFriendDialogOpen(false)}    >
                              <div  className={`group px-5 flex hover:bg-gray-300  py-3 p-2 justify-between  gap-20 items-center dark:hover:bg-[#212121]`}>
                                    <div className="flex gap-3 items-center">
                                      <Avatar className="w-10 h-10 bg-gray-300">
                                        <AvatarImage src={u?.profilePic} />
                                        <AvatarFallback>CN</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <h1 className="leading-none">{u?.username}</h1>
                                        <span className="font-thin text-sm">{u?.followers?.length} followers</span>
                                      </div>
                                    </div>
                                    <span className="text-blue-500 hidden group-hover:block">
                                    <MdOutlineArrowForwardIos></MdOutlineArrowForwardIos>
                                  </span>
                              </div>
                            </Link>    
                          ))
                        }
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={userProfile?.followers.length &&  isFollowerDialogOpen} onOpenChange={setFollowerDialogOpen}>
                  <DialogTrigger asChild>
                      <span onClick={()=> setFollowerDialogOpen(true)} >{userProfile?.followers?.length} <span className="cursor-pointer font-normal text-[15px] md:text-[18px] text-gray-700 dark:text-white">followers</span> </span>
                  </DialogTrigger>
                  <DialogContent className='p-0 overflow-hidden border-none'>
                    <h1 className="px-5 py-3 bg-blue-500 text-white" >People that follows {userProfile?.username} (Followers list) </h1>
                    <div className="flex flex-col">
                        {
                          userProfile?.followers.map((u)=>(
                          <Link key={u?._id} to={`/userProfile/${u?._id}`} onClick={()=> setFollowerDialogOpen(false)} >

                              <div key={u?._id}  className={`group px-5 flex hover:bg-gray-300  py-3 p-2 justify-between  gap-20 items-center dark:hover:bg-[#212121]`}>
                                    <div className="flex gap-3 items-center">
                                      <Avatar className="w-10 h-10 bg-gray-300">
                                        <AvatarImage src={u?.profilePic} />
                                        <AvatarFallback>CN</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <h1 className="leading-none">{u?.username}</h1>
                                        <span className="font-thin text-sm">{u?.followers?.length} followers</span>
                                      </div>
                                    </div>
                                    <span className="text-blue-500 hidden group-hover:block">
                                    <MdOutlineArrowForwardIos></MdOutlineArrowForwardIos>
                                  </span>
                              </div>
                            </Link>    
                          ))
                        }
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={userProfile?.following.length && isFollowingDialogOpen} onOpenChange={setFollowingDialogOpen} > 
                  <DialogTrigger>
                      <span onClick={()=> setFollowingDialogOpen(true)}  >{userProfile?.following?.length}  <span className="cursor-pointer font-normal text-[15px] md:text-[18px] text-gray-700 dark:text-white">following</span></span>
                  </DialogTrigger>
                  <DialogContent className='p-0 overflow-hidden'>
                    <h1 className="px-5 py-3 bg-blue-500 text-white" >People that {userProfile?.username} follows (Following list)</h1>
                    <div className="flex flex-col">
                        {
                          userProfile?.following.map((u)=>(
                            <Link key={u?._id} to={`/userProfile/${u?._id}`}   onClick={()=> setFollowingDialogOpen(false)}  >
                              <div key={u?._id}  className={`group px-5 flex hover:bg-gray-300 py-3 p-2 justify-between  gap-20 items-center dark:hover:bg-[#212121]`}>
                                    <div className="flex gap-3 items-center">
                                      <Avatar className="w-10 h-10 bg-gray-300">
                                        <AvatarImage src={u?.profilePic} />
                                        <AvatarFallback>CN</AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <h1 className="leading-none">{u?.username}</h1>
                                        <span className="font-thin text-sm">{u?.followers?.length} followers</span>
                                      </div>
                                    </div>

                                  <span className="text-blue-500 hidden group-hover:block">
                                    <MdOutlineArrowForwardIos></MdOutlineArrowForwardIos>
                                  </span>
                              </div>
                            </Link>    
                          ))
                        }
                    </div>
                  </DialogContent>
                </Dialog>
            </div>

            {
              !mobView &&
              <div className="flex flex-col items-start gap-3">
                <div>
                    {
                      userProfile?.bio?.split('\\').map((line,idx)=>
                        <h1 className="text-[11px] sm:text-[16px] text-wrap text-gray-500" key={idx} >{line}</h1>
                      )
                    }
                    <Badge variant='secondary' className='text-[12px]'  >@ {userProfile?.username}</Badge>
                </div>
              </div>
            }
          </div>
         
      </div>

      {
        mobView &&
        <div className="my-5 flex flex-col items-start gap-3">
          <div>
              {
                userProfile?.bio?.split('\\').map((line,idx)=>
                  <h1 className="text-[12px]  text-wrap text-gray-500" key={idx} >{line}</h1>
                )
              }
              <Badge variant='secondary' className='text-[11px]'  >@ {userProfile?.username}</Badge>
          </div>
        </div>
      }

      <div className=" w-full my-10 md:my-28 border-t border-t-gray-200">
          <div className="flex gap-x-2 sm:gap-x-10  text-gray-600 items-center justify-center py-[7px]">
            <Button variant='link' className={`text-gray-600 text-[14px] font-normal  ${activeTab==='posts' && 'font-bold'} sm:text-[17px] `} onClick={()=> handleTabChange('posts')} >POSTS</Button>
            <Button variant='link' className={`text-gray-600 text-[14px] font-normal  ${activeTab==='saved' && 'font-bold'} sm:text-[17px] `} onClick={()=> handleTabChange('saved')} >SAVED</Button>
            <Button variant='link' className={`text-gray-600 text-[14px] font-normal  ${activeTab==='reels' && 'font-bold'} sm:text-[17px] `} onClick={()=> handleTabChange('reels')} >REELS</Button>
            <Button variant='link' className={`text-gray-600 text-[14px] font-normal  ${activeTab==='tags' && 'font-bold'}  sm:text-[17px] `} onClick={()=> handleTabChange('tags')} >TAGS</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
              {

                displayPosts?.map((p,idx)=>
                  <div key={idx}  className="relative group cursor-pointer border- w-full">
                    {
                      (p?.mediaType === 'image' ? 
                        <img className="object-fill mb:object-cover w-full mb:h-[60vh] h-[65vh] " src={p?.media} alt="Post media" />
                       : 
                        <video  src={p?.media}  className="border-none mb:object-cover object-fill w-full mb:h-[60vh] h-[65vh]"  type="video" controls>
                        </video>
                      )
                    }
                    {
                      p?.mediaType === 'image' &&
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="flex items-center text-white space-x-4" > 
                              <button  className=' flex items-center gap-2 hover:text-gray-300' >
                                <Heart></Heart>
                                <span>{p?.likes?.length}</span>
                              </button>
                              <button className='flex items-center gap-2 hover:text-gray-300' >
                                <MessageCircle></MessageCircle>
                                <span>{p?.comments?.length}</span>
                              </button>
                        </div>
                      </div>
                    }
                  </div>
                )
              }
          </div>

      </div>

    </div>
  );
};

export default Profile;
