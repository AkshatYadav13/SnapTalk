import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Dialog, DialogContent, DialogHeader } from "./ui/dialog";
import React, { useRef, useState } from "react";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { readFileAsDataUrl } from "../lib/utils.js";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { setPosts } from "@/redux/postSlice";

const CreatePost = ({ open, setOpen }) => {
  const {user} = useSelector(store => store.auth)
  const {posts} = useSelector(store => store.post)

  const imgRef = useRef()
  const [file,setFile] = useState('')
  const [caption,setCaption] = useState('')
  const [imgPreview,setImgPreview] = useState('')
  const [loading,setLoading] = useState(false)
  const dispatch = useDispatch()
  
  async function fileChangeHandler(e){
    const file = e.target.files?.[0]
    if(file){
      setFile(file)
      const dataUrl = await readFileAsDataUrl(file)
      setImgPreview(dataUrl)
    }
  }

  function resetData(){
    setFile('')
    setImgPreview('')
    setCaption('')
    if (imgRef.current) {
      imgRef.current.value = ""; 
    }
  }

  async function createPostHandler(e) {
    e.preventDefault();
    setLoading(true)
    const formData = new FormData()
    formData.append('caption',caption)
    if(imgPreview)  formData.append('media',file)

    try {
      const res = await fetch(`https://snaptalk-q73h.onrender.com/api/v1/post/addpost`,{
        method:'POST',
        credentials:'include',
        body:formData
      })
      const data = await res.json()
      if(!res.ok){
        toast.error(data.message)
        return
      }
      if(data.success){
        dispatch(setPosts([data.post,...posts]))
        toast.success(data.message)
        setOpen(false)
      }
    } catch (error) {
      console.log(error);
    }
    finally{
        resetData()
        setLoading(false)
    }
  }

  return (
    <div>
      <Dialog open={open}>
        <DialogContent
          onInteractOutside={() => setOpen(false)}
          className="px-0 pt-2 overflow-hidden"
        >
          <DialogHeader className="pl-4 font-medium border-b border-black text-center text-[1.3em]">Create New Post</DialogHeader>
          <div className="px-4 ">
            <div className="flex gap-3 items-center">
              <Avatar className="w-10 h-10 bg-gray-300">
                <AvatarImage src={user?.profilePic} />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-semibold" >{user?.username}</h1>
                <span className="text-sm" >{user?.followers.length} followers</span>
              </div>
            </div>

            <Textarea className='custom-scrollbar my-5 focus-visible:ring-transparent border-none' placeholder='Write a caption...'
              value={caption}
              onChange={(e)=> setCaption(e.target.value)}
            ></Textarea>

            {
              imgPreview &&
              (file.type.startsWith('image/')?
                <div className="w-full h-64 flex items-center justify-center " >
                  <img className="object-cover h-full w-full "  src={imgPreview} alt="preview_img" />
                </div>
                :
                <video className="w-full object-fill h-[420px]" controls>
                  <source src={imgPreview} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )
            }

            <input type="file" className="hidden"  ref={imgRef}  name="media" accept="image/*, video/*" required  onChange={fileChangeHandler}  />
            {
              !imgPreview ?
                <div className="flex justify-center mt-[14px]">
                  <Button onClick={()=> imgRef.current.click()} >Select from Computer</Button>
                </div>              :
              !loading ?
                <div className="flex gap-3 justify-center mt-[14px]">
                  <Button variant='destructive' onClick={resetData} >Cancel</Button>
                  <Button type='submit' onClick={createPostHandler}  className='min-w-[80px]' >Post</Button>
                </div>
              :
                <div className="flex items-center justify-center mt-[14px]">
                  <Loader2 className='mr-2 h-4 w-4 animate-spin'></Loader2>
                  Please wait..
                </div>
            }
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreatePost;
