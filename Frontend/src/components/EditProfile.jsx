import { useDispatch, useSelector } from "react-redux";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import React, { useRef, useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { setUser } from "@/redux/authSlice";


const EditProfile = () => {
  const { user } = useSelector((store) => store.auth);
  const imgRef = useRef();
  const [loading,setLoading] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [input,setInput] = useState({
    profilePic:user?.profilePic,
    bio:user?.bio,
    gender:user?.gender
  })

  function fileChangeHandler(e){
    const file = e.target?.files?.[0]
    if(file){
      setInput({...input,profilePic:file})
    }
  }

  function selectChangeHandler(value){
    setInput({...input,gender:value})
  }

  function inputChangeHandler(e){
    setInput({...input,bio:e.target.value})
  }

  async function editProfileHandler() {
    const formData = new FormData()
    formData.append('bio',input?.bio)
    formData.append('gender',input?.gender)
    formData.append('profilePic',input?.profilePic)
    setLoading(true)
    try {
      const res = await fetch(`https://snaptalk-q73h.onrender.com/api/v1/user/edit/${user?._id}`,{
        method:'Post',
        credentials:'include',
        body:formData,
      })      
      const data = await res.json()
      if(!res.ok){
        toast.error(data.message)
        return
      }
      if(data.success){
        toast.success(data.message)
        dispatch(setUser(data.user))
        navigate(`/profile/${user._id}`)
        return
      }
    } catch (error) {
      console.log(error)
    }
    finally{
      setLoading(false)
    }
  }

  return (
    <div className="h-full w-full py-16 px-[25px] sm:px-[7vw] lg:px-[11vw]  dark:text-white dark:bg-[#1a1a1a] min-h-screen">
      <div className="flex flex-col gap-[2rem] max-w-[45rem] ">
        <h1 className="font-semibold text-2xl mb-2">Edit profile...</h1>

        <div className="flex flex-col  items-start gap-y-4 md:flex-row  md:justify-between md:items-center   bg-[#EEEEEE] px-[15px] py-[12px] rounded-[14px] dark:bg-[#272727]">
          <div className="flex gap-4 items-center justify-center mb:items-start">
            <Avatar className="w-12 h-12  bg-gray-300">
              <AvatarImage src={user?.profilePic} />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="font-semibold">{user?.username}</h1>
              {
                user?.bio?.split('\\').map((line,idx)=>
                  <h1 className="text-sm text-gray-500" key={idx} >{line}</h1>
                )
              }
            </div>
          </div>

          <input type="file" className="hidden" ref={imgRef} onChange={fileChangeHandler} />
          <Button variant='secondary' className=''  onClick={() => imgRef.current.click()}>Change photo</Button>
        </div>

        <div>
          <h1 className="text-xl font-medium mb-2">Bio</h1>
          <Textarea 
            className="focus-visible:ring-transparent custom-scrollbar rounded-[10px] h-[130px] mb:text-sm"
            name="bio"
            value={input.bio}
            onChange={inputChangeHandler}
          ></Textarea>
          <p className="text-sm text-gray-500" >use backslash '\' for seperating lines..</p>
        </div>

        <div>
          <h1 className="text-xl font-medium mb-2">Gender</h1>
          <Select defaultValue={user?.gender} onValueChange={selectChangeHandler} >
            <SelectTrigger className="w-[180px] focus-visible:ring-transparent">
              <SelectValue/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male" >Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end">
          {
            loading
              ?<Button  className="bg-gray-200 text-slate-900 flex items-center justify-center mt-[14px]">
                 <Loader2 className='mr-2 h-4 w-4 animate-spin'></Loader2>
                  Please wait..
              </Button>              
              :<Button onClick={editProfileHandler} >Submit</Button>
          }
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
