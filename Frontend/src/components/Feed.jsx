import React, { useEffect } from 'react'
import Posts from './Posts'
import { setPosts } from '../redux/postSlice'
import { setUserProfile } from '../redux/authSlice'
import { useDispatch, useSelector } from 'react-redux'
import { useSocket } from '@/lib/SocketContext'


const Feed = () => {
  const {posts} = useSelector(store => store.post)
  const {userProfile,user} = useSelector(store => store.auth)
  const socket = useSocket();
  
  const dispatch = useDispatch()

  useEffect(()=>{
    if(!socket) return

    socket.on('updateData', ({ type, senderId, post }) => {
      if (type === 'like' || type === 'dislike') {
        const newPostsArr = posts.map((p) =>
          p._id === post._id
            ? {
                ...p,
                likes:
                  type === 'like' 
                    ? p.likes.includes(senderId) ?  [...p.likes] : [senderId, ...p.likes]
                    : p.likes.filter((id) => id !== senderId),
              }
            : p
        );
        dispatch(setPosts(newPostsArr));

        const authorId = posts.find((p)=> p._id === post._id)?.author?._id
        if(authorId === user._id){
          const newUserPost =  userProfile.posts.map((p)=>
            p._id === post._id
              ? {
                  ...p,
                  likes:
                    type === 'like' 
                      ? p.likes.includes(senderId) ?  [...p.likes] : [senderId, ...p.likes]
                      : p.likes.filter((id) => id !== senderId),
                }
              : p
            )
            const newUserProfileData = {...userProfile,posts:newUserPost}
            dispatch(setUserProfile(newUserProfileData))
        }
      }
    });
    
    socket.on('newPostCreated',(newPost)=>{
      dispatch(setPosts([...posts,newPost]))
    })
    
    socket.on('deletePost',(postId)=>{
      const updatedPostsArray = posts.filter(p => p?._id!== postId )
      dispatch(setPosts(updatedPostsArray))

    })

    return(()=>{
      socket.off('updateData')
      socket.off('newPostCreated')
      socket.off('deletePost')
    })

  },[socket,posts])

  return (
    <div className='flex flex-col items-center min-w-[350px] py-7 pr-2 pl-4 lg:px-10 lg:py-8 lg:max-w-[45vw]'>
        <Posts></Posts>
    </div>
  )
}

export default Feed