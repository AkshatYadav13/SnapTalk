import React, { useEffect, useRef, useState } from 'react'
import { Textarea } from "../ui/textarea";
import { Button } from '../ui/button';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';


const SetProfile = () => {
    const params = useParams()
    const userId = params.id
    const imgRef = useRef()
    const navigate = useNavigate()
    const [loading,setloading] = useState(false)


    const [input,setInput] = useState({
        bio:'',
        profilePic:'',
        gender:''
    })

    function inputChangeHandler(e){
        setInput({...input,[e.target.name]:e.target.value})
    }

    function fileChangeHandler(e){
        const file = e.target?.files?.[0]
        if(file){
            setInput({...input,profilePic:file})
        }
    }

    async function submitHandler(){
        const formData = new FormData()
        if(input.bio)  formData.append('bio',input.bio)
        if(input.gender)  formData.append('gender',input.gender)
        if(input.profilePic)    formData.append('profilePic',input.profilePic)

        try {
            setloading(true)
            const res = await fetch(`http://localhost:8000/api/v1/user/edit/${userId}`,{
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
                setTimeout(() => {
                    navigate(`/login`)
                }, 500);
                return
              }        
        } catch (error) {
            console.log(error)
        }finally{
            setloading(false)
        }
    }


    // theme
    const {theme} = useSelector(store=> store.auth)
    
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove(theme === 'light' ? 'dark' : 'light');
        root.classList.add(theme);
    }, [theme]);

  return (
    <div className='flex justify-center items-center h-screen w-full dark:bg-[#1a1a1a] dark:text-white'>
        <div className='w-[360px] md:min-w-[450px] dark:bg-[#212121] px-5 py-8 mb:px-1 mb:mx-2 rounded-[20px]' >
            <h1 className='border-b  text-center text-[19px] font-light  mb-8' >Set profile for enhanced experience</h1>

            <div className='flex flex-col gap-9 mb-14' >
                <div>
                    <h1 className="text-[19px] mb-2 font-medium">Bio</h1>
                    <Textarea 
                        className="focus-visible:ring-transparent custom-scrollbar rounded-[10px] min-h-[120px]"
                        name="bio"
                        value={input.bio}
                        onChange={inputChangeHandler}
                    ></Textarea>
                    <p className="text-sm text-gray-500" >use backslash '\' for seperating lines..</p>
                </div>

                <div>
                <span className="font-medium p-2">Gender</span><br></br>
                <div className="flex gap-5 pl-2 p-2" >
                    <div>
                    <input
                        name="gender"
                        value='Male'
                        onChange={inputChangeHandler}
                        type="radio"
                        className="focus-visible:ring-transparent"
                        id="male"
                    ></input>
                    <label htmlFor="male">Male</label>
                    </div>
                    <div>
                    <input
                        name="gender"
                        value='Female'
                        onChange={inputChangeHandler}
                        type="radio"
                        className="focus-visible:ring-transparent"
                        id="female"
                    ></input>
                    <label htmlFor="female">Female</label>
                    </div>
                    <div>
                    <input
                        name="gender"
                        value='Other'
                        onChange={inputChangeHandler}
                        type="radio"
                        className="focus-visible:ring-transparent"
                        id="other"
                    ></input>
                    <label htmlFor="other">Other</label>
                    </div>
                </div>
                </div>

                <div>
                    <input type="file" className='hidden'  ref={imgRef} onChange={fileChangeHandler}/>
                    <Button variant='secondary' onClick={()=> imgRef.current.click()}  className='text-[15px] w-full text-slate-900' >Select Profile Photo from device</Button>
                </div>
            </div>


            <div className='flex gap-3 justify-center'>
                {
                    loading?
                    <Button className='bg-gray-200 text-slate-900'>
                        <Loader2 className='mr-2 h-6 w-6 animate-spin'></Loader2>
                        please wait
                    </Button>
                    :
                    <>
                    <Button  onClick={()=> navigate('/login')}  variant='secondary'>Later</Button>
                    <Button onClick={submitHandler} >Continue</Button>
                    </>
                }
            </div>
        </div>
    </div>
  )
}

export default SetProfile
