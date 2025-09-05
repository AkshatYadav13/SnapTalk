import React, { useEffect, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {toast} from 'sonner'
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useSelector } from "react-redux";

const Signup = () => {
  const [input, setInput] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading,setloading] = useState(false)
  const {user} = useSelector(store=> store.auth)
  const navigate = useNavigate()


  async function signupHandler(e){
    e.preventDefault()
    try {
      setloading(true)
      const res = await fetch(`https://snaptalk-q73h.onrender.com/api/v1/user/register`,{
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
          navigate(`/setProfile/${data.newUserId}`)
        }, 400);
        setInput({
          username: "",
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

  function changeEvtHandler(e) {
    setInput({ ...input, [e.target.name]: e.target.value });
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
      <form onSubmit={signupHandler} className="shadow-lg flex flex-col gap-5 p-8 dark:bg-[#212121]">
            <div className="my-3 text-center">
              <h1 className="font-bold text-xl py-2">Logo</h1>
              <p className="font-light [17px]">
                Signup to see photos & videos from your friends
              </p>
            </div>

            <div>
              <span className="font-medium p-2">Username<span className='text-red-500' > *</span></span>
              <Input
                name="username"
                value={input.username}
                onChange={changeEvtHandler}
                type="text"
                className="focus-visible:ring-transparent"
                required
              ></Input>
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
              <Button className='bg-gray-200 text-slate-900'>
                <Loader2 className='mr-2 h-6 w-6 animate-spin'></Loader2>
                Please wait...
              </Button>
              :
              <Button type='submit' >Signup</Button>
            }
            <span className="text-center" >Already have an account?  
              <Link className="text-blue-900" to='/login'> Login</Link>
            </span>
      </form>
    </div>
  );
};

export default Signup;
