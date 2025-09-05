import { createSlice } from "@reduxjs/toolkit";

const authSlice  = createSlice({
    name:'auth',
    initialState:{
        connected:false,
        user:null,
        suggestedUsers:[],
        selectedUser:null,
        userProfile:null, //for storing profile page data,
        theme:'light'
    },
    reducers:{
        setConnected:(state,action)=>{
            state.connected = action.payload
        },
        setUser:(state,action)=>{
            state.user = action.payload
        }  ,    
        setSuggestedUsers:(state,action)=>{
            state.suggestedUsers = action.payload
        },
        setSelectedUser:(state,action)=>{
            state.selectedUser = action.payload
        },
        setUserProfile:(state,action)=>{
            state.userProfile = action.payload
        }  , 
        toggleTheme:(state)=>{
            state.theme = state.theme==='light' ? 'dark' :'light'
        }   
    }
})

export const {toggleTheme,setConnected,setUser,setSuggestedUsers,setUserProfile,setSelectedUser} = authSlice.actions

export default authSlice.reducer;