import React from 'react'
import Post from './Post'
import { useSelector } from 'react-redux'

const Posts = () => {

  const {posts} = useSelector(store => store.post)

  return (
    <div className='overflow-y-auto max-h-[95vh] custom-scrollbar pr-1 max-w-[100%]'>
        {
            posts.map((post)=>(
                <Post key={post?._id} post={post} ></Post>
            ))
        }
    </div>
  )
}

export default Posts