import React, { useState } from 'react'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { useDispatch, useSelector } from 'react-redux'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Button } from './ui/button'
import { useRef } from 'react'
import { MdOutlineDone } from "react-icons/md";
import { MdClose } from "react-icons/md";
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { setUser } from '@/redux/authSlice'
import { Loader2 } from 'lucide-react'


const CreateGroup = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const imgRef = useRef()
    const {suggestedUsers,user} = useSelector(store=> store.auth)
    const [loading,setLoading] = useState(false)

    const [input,setInput] = useState({
        name:'',
        description:'',
        memberIds:[],
        icon:''
    })

    function handleInputChange(e){
        setInput({...input,[e.target.name]:e.target.value})
    }

    function handleFileChange(e){
        const file = e.target.files[0]
        if(file){
            setInput({...input,icon:file})
        }
    }

    function addMemberHandler(userId){
        const memberIds = input.memberIds
        if(memberIds.includes(userId)){
            memberIds.pop(userId)
        }
        else{
            memberIds.push(userId)
        }
        setInput({...input,memberIds})
    }

    function resetFileSelected(){
        setInput({...input,icon:''})
        imgRef.current.value=''
    }

    async function submitHandler(){
        if(!input.name)     toast.info('Name of group is mandatory')
        else if(input.memberIds.length<1) toast.info('Select atleast one member')
        else{
            const formData = new FormData()
            formData.append('name',input?.name)
            formData.append('description',input?.description)
            formData.append('icon',input?.icon)
            formData.append('memberIds',input?.memberIds)
            setLoading(true)
            try {
                const res = await fetch(`https://snaptalk-q73h.onrender.com/api/v1/group/create`,{
                    method:'Post',
                    credentials:'include',
                    body:formData
                })
                const data = await res.json()

                if(!res.ok){
                    toast.error(data.message)
                    return
                }
                if(data.success){
                    toast.success(data.message)
                    const updatedUser = {...user,groupJoined:[...user.groupJoined,data.group]}
                    dispatch(setUser(updatedUser))
                    
                    setTimeout(()=>{
                        navigate('/chat')
                        setInput({
                            name:'',
                            icon:'',
                            memberIds:'',
                            description:''
                        })
                    },[800])

                    return
                }

            } catch (error) {
                console.log(error)
            }
            finally{
                setLoading(false)
            }
        }
    }


  return (
    <div className='w-full h-full flex items-center justify-center dark:text-white dark:bg-[#1a1a1a]'>
        <div className='mb:min-w-[290px] w-2/3 lg:w-1/2 pt-[60px]'>

            <h1 className='text-center text-2xl'>Create new group</h1>

            <div className='my-10 flex flex-col gap-10'>
                <div>
                    <label className='font-medium mb-2'>Name<span className='text-red-500' > *</span></label>
                    <Input name='name' value={input.name} onChange={handleInputChange}  type='text' className='focus-visible:ring-transparent' required ></Input>
                </div>

                <div>
                    <h1 className="font-medium mb-2">Description</h1>
                    <Textarea 
                        value={input.description}
                        onChange={handleInputChange}
                        className="focus-visible:ring-transparent min-h-[130px] custom-scrollbar rounded-[10px]"
                        name="description"
                    ></Textarea>
                </div>


                <div className='flex flex-col '>
                    <label className='font-medium'>Add members</label>
                    <p className='mb-4 text-sm text-gray-500' >select atleast one member</p>
                    <div className='max-h-[35vh] w-full custom-scrollbar overflow-auto border dark:border-[#312e2e]'>
                        {
                            [...user?.friends,...suggestedUsers].map((u)=>
                                <div key={u._id}  className='py-[10px] pl-2 relative flex items-center justify-between pr-4  border-b border-b-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#212121] dark:border-[#312e2e]'
                                     onClick={()=> addMemberHandler(u._id)}>

                                    <div className='flex gap-4 items-center'>
                                        <Avatar className='w-8 h-8  bg-gray-300' >
                                            <AvatarImage src={u?.profilePic} />
                                            <AvatarFallback>CN</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h1 className='text-medium font-semibold text-nowrap mb:text-sm'>{u?.username}</h1>
                                        </div>
                                    </div>
                                    {
                                        input.memberIds.includes(u._id) &&
                                        <span className='bg-green-600 rounded-[10px] p-[2px]'>
                                            <MdOutlineDone className=' text-white  text-[12px]'></MdOutlineDone>
                                        </span>
                                    }
                                </div>
                            )
                        }
                    </div>
                </div>

                <div className='flex flex-col gap-8 my-2 lg:items-center'>
                    <input type='file' ref={imgRef}  onChange={handleFileChange}  className='hidden'  required></input>
                    <button onClick={()=> !input.icon && imgRef.current.click() }  className={`flex items-center justify-center rounded-[30px] p-2 px-3 border border-gray-500 ${input.icon ? 'bg-gray-300':'lg:w-[400px] hover:bg-gray-200 dark:bg-slate-800 dark:border border-gray-500   dark:hover:bg-slate-700 '}`} >
                        {
                            input.icon ?
                            <div className='text-black flex items-center justify-center gap-x-3 border border-gray-400 rounded-[15px] px-3 pb-1'>
                                <span className='pt-[5px] group'   onClick={resetFileSelected}><MdClose className='group-hover:text-red-500' ></MdClose></span>
                                <span className='text-center leading-none text-wrap'>{input.icon.name}</span>
                            </div>
                            :
                            <span > select group icon</span>
                        }
                    </button>

                    {
                        loading
                        ?<Button  className="bg-gray-200 text-slate-900 flex items-center justify-center mt-[14px]">
                            <Loader2 className='mr-2 h-4 w-4 animate-spin'></Loader2>
                            Please wait..
                        </Button>              
                        :<Button className='lg:w-[400px]' onClick={submitHandler} >Submit</Button>
                    }
                </div>
            </div>

        </div>
    </div>
  )
}

export default CreateGroup