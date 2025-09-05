import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { IoMdArrowBack } from "react-icons/io";


const BackButton = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [HistoryStack,setHistoryStack] = useState([])

    useEffect(()=>{
        if(location.pathname!==HistoryStack[HistoryStack.length-1] || HistoryStack.length===0){
            setHistoryStack((prevStack) => [...prevStack, location.pathname]);
        }
    },[location])

    
    function goBack(){
        if(HistoryStack.length>1){
            const newHistory = [...HistoryStack]
            newHistory.pop()
            const pageToshow = newHistory.pop()

            setHistoryStack(newHistory)
            navigate(pageToshow)
        }
    }

  return (
    <div>{
        HistoryStack.length>1 &&
            <IoMdArrowBack className='hover:text-blue-500 w-6 h-6  cursor-pointer' onClick={goBack} ></IoMdArrowBack>
    }</div>
  )
}

export default BackButton