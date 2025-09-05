import { setUser } from '@/redux/authSlice'
import { setOnlineUsers } from '@/redux/chatSlice'
import { addNotification } from '@/redux/rtnSlice'
import React, {  createContext, useContext, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {io} from 'socket.io-client'


const SocketContext = createContext()

export const useSocket = ()=> useContext(SocketContext)

export const SocketProvider = ({children}) => {

    const [socket,setSocket] = useState(null)
    const {user,connected} = useSelector(store => store.auth)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    useEffect(() => {
        if (!socket && user?._id) {
          const socketio = io('http://localhost:8000', {
            query: { userId: user?._id },
            transports: ["websocket"],
          });
          setSocket(socketio)
      
          socketio.on('getOnlineUsers', (onlineUsers) => {
            dispatch(setOnlineUsers(onlineUsers));
          });
      
          socketio.on('notification', (notification) => {
            dispatch(addNotification(notification));        
          });
    
          socketio.on('newGroup', (group) => {
            const updatedUser = {...user,groupJoined:[...user.groupJoined,group]}
            dispatch(setUser(updatedUser))
          });          
          
          return () => {
            socketio.off('getOnlineUsers'); 
            socketio.off('notification');
            socketio.off('newgroup');
            socketio.disconnect(); 
          };
    
        } else if (!user && socket) {
          socket.disconnect(); 
          setSocket(null)
          dispatch(setOnlineUsers([])); 
          navigate('/login');
        }
      }, [connected]);
      

    return(
        <SocketContext.Provider value={socket}  >{children}</SocketContext.Provider>
    );
}

