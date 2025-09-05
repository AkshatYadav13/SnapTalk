import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { MoreHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { setPosts } from "@/redux/postSlice";
import { IoSend } from "react-icons/io5";


const CommentDialog = ({ open, setOpen, post }) => {

  const [text,setText] = useState('')
  const [comments,setComments] = useState(post?.comments)
  const {posts} = useSelector(store => store.post)
  const dispatch = useDispatch()

  function changeEvtHandler(e){
    const inputTxt = e.target.value
    if(inputTxt.trim()){
      setText(inputTxt)
    }
    else{
      setText('')
    }
  }

  async function commentHandler() {
    if(!text) return
    const input={
        'message':text
    }
    try {
        const res = await fetch(`http://localhost:8000/api/v1/post/addComment/${post._id}`,{
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

  return (
    <Dialog open={open}>
      <DialogContent
        onInteractOutside={() => setOpen(false)}
        className="max-w-4xl p-0"
      >
        <div className="grid grid-cols-[1fr_1.4fr] ">
          {
            post.mediaType === 'image' ? (
              <img className="h-[500px] w-full" src={post?.media} alt="Post media" />
            ) : (
              <video className="w-full h-[500px] object-fill" controls>
                <source src={post?.media} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )
          }
          <div className="flex flex-col gap-5">
            <div className="flex justify-between border-b-[1px] border-black py-1 pr-3 dark:border-[#312e2e]">
              <Link>
                <div className="flex gap-3 items-center  pl-4">
                  <Avatar className="w-8 h-8 bg-gray-300">
                    <AvatarImage src={post?.author?.profilePic} />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <h1>{post?.author.username}</h1>
                </div>
              </Link>
              <Dialog>
                <DialogTrigger asChild>
                  <MoreHorizontal className="cursor-pointer"></MoreHorizontal>
                </DialogTrigger>
                <DialogContent className="flex flex-col gap-0 text-center p-0 font-medium overflow-hidden">
                  <h1 className="hover:bg-gray-200 leading-10 border-b-[1px] border-b-black cursor-pointer w-full dark:border-[#312e2e] dark:hover:bg-[#212121] py-2">
                    Add to favorites
                  </h1>
                  <h1 className="hover:bg-gray-200 leading-10 border-b-[1px] border-b-black- cursor-pointer w-full text-[#ED4956] dark:border-none dark:hover:bg-[#212121] py-2">
                    Unfollow
                  </h1>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[377px] pr-2 pl-4 custom-scrollbar">
              {
                post?.comments.map((c)=>
                  <div key={c._id}  className="bg-[#93daeb83] rounded-[12px] p-1 mb-3  hover:bg-[#8bd8eb99]">
                      <div className="flex gap-3 ">
                          <Avatar className="w-7 h-7 bg-gray-300">
                            <AvatarImage src={c?.author?.profilePic} />
                            <AvatarFallback>CN</AvatarFallback>
                          </Avatar>
                          <h1 className="" >{c?.author?.username}</h1>
                        </div>
                        <p className="pl-10 text-gray-800" >{c?.message}</p>
                  </div>
                )
              }
              </div>

            <div className="flex items-center relative">
              <input value={text} onChange={changeEvtHandler}  type="text" placeholder="Add a comment..." className="pr-10 w-full p-2 pl-4 border-[1px] border-gray-300 rounded outline-none text-black dark:bg-[#212121] dark:text-white"/>
              {text && <IoSend disabled={!text.trim()} onClick={commentHandler} className='absolute right-2 w-5 h-5'>Send</IoSend> }
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentDialog;
