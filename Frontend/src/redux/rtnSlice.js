import { createSlice } from "@reduxjs/toolkit";

const rtnSlice = createSlice({
    name:'realTimeNotification',
    initialState:{
        notifications:[],
    },
    reducers:{
        addNotification:(state,action)=>{
            if(!state.notifications?.includes(action.payload)){
                state.notifications.push(action.payload)
            }
        },
        setNotifications:(state,action)=>{
            state.notifications = action.payload
        },
        deleteNotifications:(state,action)=>{
            state.notifications = state.notifications.filter(n=> !action.payload.includes(n._id))
        }
    }
})

export const {addNotification,setNotifications,deleteNotifications} = rtnSlice.actions

export default rtnSlice.reducer