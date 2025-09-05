import React, { useState } from 'react'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { useDispatch, useSelector } from 'react-redux'
import { Button } from './ui/button'
import { useRef } from 'react'
import { MdClose } from "react-icons/md";
import { toast } from 'sonner'
import { useNavigate, useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { readFileAsDataUrl } from '@/lib/utils'
import { setSelectedGroup } from '@/redux/chatSlice'
import { setUser } from '@/redux/authSlice'


const EditGroup = () => {
    const params = useParams()
    const groupId = params.id
    const {user} = useSelector(store=> store.auth)
    const selectedGroup = user.groupJoined.filter(g=> g._id===groupId)[0]

    const navigate = useNavigate()
    const dispatch = useDispatch()
    const imgRef = useRef()
    const [loading,setLoading] = useState(false)
    const [imgPreview,setImgPreview] = useState(selectedGroup?.icon)


    const [input,setInput] = useState({
        name:selectedGroup?.name,
        description:selectedGroup?.description,
        icon:''
    })

    function handleInputChange(e){
        setInput({...input,[e.target.name]:e.target.value})
    }

    async function handleFileChange(e){
        const file = e.target.files[0]
        if(file){
            setInput({...input,icon:file})
            const dataUrl = await readFileAsDataUrl(file)
            setImgPreview(dataUrl)
        }
    }

    function resetFileSelected(){
        setInput({...input,icon:''})
        imgRef.current.value=''
        setImgPreview('')
    }

    async function submitHandler(){
        if((input.name===selectedGroup.name) && (input.description===selectedGroup.description) && !input.icon){
            toast.error('seems like you not want to change anything.')
            return
        }
        setLoading(true)
        const formData = new FormData()
        input.name!==selectedGroup.name && formData.append('name',input?.name)
        input.description!==selectedGroup.description && formData.append('description',input?.description)
        input.icon && formData.append('icon',input?.icon)
        
        try {
            const res = await fetch(`http://localhost:8000/api/v1/group/edit/${groupId}`,{
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
                let updatedSelGrp = {...selectedGroup,
                    name:input.name,
                    description:input.description,
                }
                if(data.icon){
                    updatedSelGrp = {...updatedSelGrp,icon:data.icon}
                }
                dispatch(setSelectedGroup(updatedSelGrp))

                let updateUser = {...user,groupJoined:
                    user.groupJoined.map(g=>(
                        g._id===groupId ?
                            {...g , ...updatedSelGrp}
                        :
                        g
                    ))
                }
                dispatch(setUser(updateUser))

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


  return (
    <div className='w-full h-screen flex items-center justify-center dark:bg-[#1a1a1a]  dark:text-white'>
        <div className='mb:min-w-[290px] w-2/3 lg:w-1/2 pt-[40px]'>

            <h1 className='text-center text-2xl '>Edit group</h1>

            <div className='my-10 flex flex-col gap-10'>
                <div className='flex flex-col items-center gap-4'>
                    <img src={imgPreview } alt="no image" className='w-32 h-32' />

                    <input type='file' ref={imgRef}  onChange={handleFileChange}  className='hidden'  required></input>
                    <button  onClick={()=> !input.icon && imgRef.current.click() }  className={`flex items-center justify-center rounded-[30px] p-2 px-3 text-slate-900 hover:bg-gray-200 border border-gray-500 bg-white ${input.icon ? 'bg-gray-300':'lg:w-[400px]  dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700'}`} >
                        {
                            input.icon ?
                            <div className='text-black flex items-center justify-center gap-x-3 border border-gray-400 rounded-[15px] px-3 pb-1'>
                                <span className='pt-[5px] group'   onClick={resetFileSelected}><MdClose className='group-hover:text-red-500' ></MdClose></span>
                                <span className='text-center leading-none text-wrap'>{input.icon.name || 'default img'}</span>
                            </div>
                            :
                            <span> change group icon</span>
                        }
                    </button>
                </div>


                <div>
                    <label className='font-medium mb-2'>Name<span className='text-red-500' > *</span></label>
                    <Input name='name' value={input.name} onChange={handleInputChange}  type='text' className='focus-visible:ring-transparent' required ></Input>
                </div>

                <div>
                    <h1 className="font-medium mb-2">Description</h1>
                    <Textarea 
                        value={input.description  } 
                        onChange={handleInputChange}
                        className="focus-visible:ring-transparent min-h-[130px] custom-scrollbar rounded-[10px]"
                        name="description"
                    ></Textarea>
                </div>

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
  )
}

export default EditGroup