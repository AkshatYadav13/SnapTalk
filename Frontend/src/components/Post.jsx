import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Dialog,DialogContent,DialogTrigger,} from "./ui/dialog"
import {  Bookmark, MessageCircle, MoreHorizontal, Send } from 'lucide-react'
import { Button } from './ui/button'
import { FaHeart, FaRegHeart } from "react-icons/fa";
import CommentDialog from './CommentDialog'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { setPosts } from '@/redux/postSlice'
import { Badge } from './ui/badge'
import { IoSend } from "react-icons/io5";
import { FcBookmark } from "react-icons/fc";
import { setUser } from '@/redux/authSlice'
import Video from './Video'

const Post = ({post}) => {
    const {posts} = useSelector(store => store.post)
    const {user} = useSelector(store => store.auth)

    const dispatch = useDispatch()
    const [text,setText] = useState('')
    const [open,setOpen] = useState(false)
    const [liked,setLiked] = useState(post?.likes && post?.likes?.includes(user?._id) ? true :false )
    const postLikes = posts.find((p)=> p._id===post._id)?.likes?.length
    const [comments,setComments] = useState(post?.comments)
    const [isFollowing,setisFollowing] = useState(user?.following.map(u=> u._id).includes(post?.author._id))

    function changeEvtHandler(e){
        const inputText = e.target.value

        if(inputText.trim()) setText(inputText)
        else  setText('')
    }

    async function deletePost(){
        try {
            const res = await fetch(`https://snaptalk-q73h.onrender.com/api/v1/post/delete/${post._id}`,{
                method:'GET',
                credentials:'include'
            })
            const data = await res.json()
            if(!res.ok){
                toast.error(data.message)
                return
            }
            if(data.success){
                toast.success(data.message)
                const updatedPostsArray = posts.filter(p => p?._id!== post?._id )
                dispatch(setPosts(updatedPostsArray))
                return
            }
        } catch (error) {
            console.log(error)
        }
    }

    async function likeAndDislikeHandler() {
        try {
            const action =  liked ? 'dislike': 'like'
            const res = await fetch(`https://snaptalk-q73h.onrender.com/api/v1/post/${action}/${post._id}`,{
                method:'get',
                credentials:'include'
            })
            const data = await res.json()

            if(!res.ok){
                toast.error(data.message)
                return
            }
            if(data.success){
                const updatedPostArray = posts.map((p)=>
                    p?._id === post?._id
                    ?{
                        ...p,
                        likes: liked ? p.likes.filter(id => id!== user?._id) : [...p.likes, user?._id]
                    }
                    :p
                )

                dispatch(setPosts(updatedPostArray))
                setLiked(!liked)
                toast.success(data.message)
                return
            }
        } catch (error) {
            console.log(error)
        }
    }


    async function commentHandler() {
        const input={
            'message':text
        }
        try {
            const res = await fetch(`https://snaptalk-q73h.onrender.com/api/v1/post/addComment/${post._id}`,{
                method:'POST',
                credentials:'include',
                body:JSON.stringify(input),
                headers:{
                    'Content-type':'application/json'
                }
            })
            const data = await res.json()

            if(!res.ok){
                toast.error(data.message)
                return
            }
            if(data.success){
                const updatedCommentData = [...comments,data.comment]
                setComments(updatedCommentData)

                const updatedPostArray = posts.map((p)=>
                    p._id === post._id ?{
                        ...p,
                        comments:updatedCommentData
                    }
                    :p
                )
                dispatch(setPosts(updatedPostArray))
                setText('')
                toast.success(data.message)
                return
            }
        } catch (error) {
            console.log(error)
        }
    }

    async function bookmarkHandler() {
        try {
            const res = await fetch(`https://snaptalk-q73h.onrender.com/api/v1/post/bookmark/${post._id}`,{
                method:'Get',
                credentials:'include'
            })
            const data = await res.json()
            if(!res.ok){
                toast.error(data.message)
                return
            }
            if(data.success){
                toast.success(data.message)
                const updatedUser = {
                    ...user,
                    bookmarks:user.bookmarks.map(p=>p._id).includes(post._id)
                     ? user.bookmarks.filter(p=>p._id!=post._id)
                     :  [...user.bookmarks,post]
                }
                dispatch(setUser(updatedUser))
                return
            }

        } catch (error) {
            console.log(error)
        }
    }

    async function followUnfollowHandler(userId) {
        try {
          const res = await fetch(`https://snaptalk-q73h.onrender.com/api/v1/user/followOrUnfollow/${userId}`,{
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
                updatedUser = {...user,following:user.following.map(u=>u._id).includes(data.user._id) ? [...user.following] : [...user.following,data.user] }
                setisFollowing(true)
            }
            else if(data.type==='unfollow'){
                updatedUser = {...user,following: user.following.filter(u=>u._id!=data.user._id)}
                setisFollowing(false)
            }
            dispatch(setUser(updatedUser))
            return
          }
    
        } catch (error) {
          console.log(error)
        }
      }
    

  return (
    <div  className='mb-10 flex flex-col gap-4  dark:text-white'>
        <div className='flex justify-between'>
            <div className='flex gap-3 items-center '>
                <Avatar className='w-8 h-8  bg-gray-300' >
                    <AvatarImage src={post?.author?.profilePic} />
                    <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div>
                    <h1 className='text-sm'>{post?.author?.username}</h1>
                    {
                        post?.author._id === user?._id &&  <Badge variant='secondary'>Author</Badge>
                    }
                </div>
            </div>
            
            <Dialog>
                <DialogTrigger asChild>
                    <MoreHorizontal className='cursor-pointer' ></MoreHorizontal>
                </DialogTrigger>
                <DialogContent className='flex justify-center items-center' >
                    <div  className='flex flex-col gap-y-3 w-2/4 text-sm text-center'   >
                        <Button >Add to favorites</Button>
                        {
                            user?._id === post?.author?._id ?
                            <Button  variant='destructive' onClick={deletePost} >Delete</Button>
                            :
                            isFollowing ?
                            <Button  variant='destructive' onClick={()=>followUnfollowHandler(post?.author?._id)} >Unfollow</Button>
                            :
                            <Button   onClick={()=>followUnfollowHandler(post?.author?._id)} >follow</Button>
                        }
                    </div>
                </DialogContent>
            </Dialog>
        </div>
        {
            post?.mediaType === 'image' ? (
              <img className="h-[565px] w-full" src={post?.media} alt="Post media" />
            ) : (
              <Video src={post?.media}>
              </Video>
            )
        }

        <div className='flex justify-between'>
            <div className='flex gap-4'>
                {
                    liked
                    ?<FaHeart size={25}    className='text-red-600 cursor-pointer'  onClick={likeAndDislikeHandler} ></FaHeart>
                    :<FaRegHeart size={25} className='cursor-pointer' onClick={likeAndDislikeHandler} ></FaRegHeart>
                }
                <MessageCircle onClick={()=> setOpen(true)} className='cursor-pointer hover:text-gray-600' ></MessageCircle>
                <Send className='cursor-pointer hover:text-gray-600' ></Send>
            </div>
            {
                user?.bookmarks.map(b=>b._id).includes(post._id)?
                <FcBookmark  className='w-6 h-6 cursor-pointer hover:text-gray-600' onClick={bookmarkHandler} ></FcBookmark>
                :
                <Bookmark  className='cursor-pointer hover:text-gray-600' onClick={bookmarkHandler} ></Bookmark>
            }
        </div>
        
        <div>
            <span className='font-medium' >  {postLikes} likes</span>
            <p>
                <span className='font-medium mr-4' >{post?.author?.username}</span>
                {post?.caption}
            </p>
        </div>
        
        <span onClick={()=> setOpen(true)} className='text-sm cursor-pointer text-gray-400'> {post?.comments.length>0  ? `View all ${post?.comments.length} comments.. `: 'no comments' }</span>
        <CommentDialog open={open} setOpen={setOpen} post={post}  ></CommentDialog>

        <div  className='flex items-center justify-between pr-2 gap-2'>
            <input 
                className='outline-none text-sm w-full dark:bg-[#212121] py-1 pl-1' 
                type="text"
                placeholder='Add a comment..' 
                value={text}
                onChange={changeEvtHandler} />
            {
                text && <IoSend className='font-medium w-5 h-5 cursor-pointer' onClick={commentHandler} >Post</IoSend>
            }
        </div>
    </div>
  )
}

export default Post