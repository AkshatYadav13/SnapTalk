import React, { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {toast} from 'sonner'
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setConnected, setUser } from "@/redux/authSlice";

const Login = () => {
    const [input, setInput] = useState({
    email: "",
    password: "",
  });

  const [loading,setloading] = useState(false)
  const {user} = useSelector(store=> store.auth)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  function changeEvtHandler(e) {
    setInput({ ...input, [e.target.name]: e.target.value });
  }

  async function loginHandler(e){
    e.preventDefault()
    try {
      setloading(true)
      const res = await fetch(`http://localhost:8000/api/v1/user/login`,{
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
        setTimeout(() => {
          toast.success(data.message)
          dispatch(setUser(data.user))
          dispatch(setConnected(true))
          
          navigate('/')
        }, 400);
        setInput({
          email: "",
          password: "",
        })
      }
    } catch (error) {
      toast.error('Unexpected error happened')
    }
    finally{
      setTimeout(()=>{
        setloading(false)
      },400)
    }
  }

  useEffect(()=>{
    if(user){
      navigate('/')
    }
  },[])


  // theme
  const {theme} = useSelector(store=> store.auth)
  useEffect(() => {
  const root = window.document.documentElement;
  root.classList.remove(theme === 'light' ? 'dark' : 'light');
  root.classList.add(theme);
  }, [theme]);


  return (
    <div className="flex h-screen w-full justify-center items-center rounded-md dark:bg-[#1a1a1a] dark:text-white">
      <form onSubmit={loginHandler} className="shadow-lg flex flex-col gap-5 p-8 dark:bg-[#212121]">
        <div className="my-3 text-center">
          <h1 className="font-bold text-xl py-2">Logo</h1>
          <p className="font-light text-[17px]">
            Login to see photos & videos from your friends
          </p>
        </div>
        <div>
          <span className="font-medium p-2">Email<span className='text-red-500' > *</span></span>
          <Input
            name="email"
            value={input.email}
            onChange={changeEvtHandler}
            type="text"
            className="focus-visible:ring-transparent"
            required
          ></Input>
        </div>
        <div>
          <span className="font-medium p-2">Password<span className='text-red-500' > *</span></span>
          <Input
            name="password"
            value={input.password}
            onChange={changeEvtHandler}
            type="text"
            className="focus-visible:ring-transparent"
            required
          ></Input>
        </div>
        {
          loading?
          <Button  className='bg-gray-200 text-slate-900'>
            <Loader2 className='mr-2 h-6 w-6 animate-spin'></Loader2>
            Please wait...
          </Button>
          :
          <Button type='submit' >Login</Button>
        }
        <span className="text-center" >Dont have an account?  
          <Link className="text-blue-900" to='/signup'> Signup</Link>
        </span>
      </form>
    </div>
  );
};

export default Login;
