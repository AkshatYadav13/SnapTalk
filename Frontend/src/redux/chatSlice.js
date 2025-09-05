import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
    name:'chat',
    initialState:{
        onlineUsers:null,
        messages:[],
        newMessages:[],
        unseenMsgIds:[],

        selectedGroup:'',
        grpNewMsgs:[],
        grpUnseenMsgIds:[],
    },
    reducers:{
        setOnlineUsers:(state,action)=>{
            state.onlineUsers = action.payload
        },
        addMessages:(state,action)=>{
            if(!state.messages.includes(action.payload)){
                state.messages.push(action.payload)
            }
        },
        setMessages:(state,action)=>{
            state.messages = action.payload
        },
        setNewMessages:(state,action)=>{
            state.newMessages = action.payload
        },
        addNewMessages:(state,action)=>{
            if(!state.newMessages.includes(action.payload)){
                state.newMessages.push(action.payload)
            }
        },
        setUnseenMsgIds:(state,action)=>{
            state.unseenMsgIds = action.payload
        },
        addUnseenMsgIds:(state,action)=>{
            if(!state.unseenMsgIds.includes(action.payload)){
                state.unseenMsgIds.push(action.payload)
            }
        },
        clearUnseenMsgIds: (state) => {
            state.unseenMsgIds = [];
        },



        setSelectedGroup:(state,action)=>{
            state.selectedGroup = action.payload
        },
        setGrpNewMessages:(state,action)=>{
            state.grpNewMsgs = action.payload
        },
        addGrpNewMessages:(state,action)=>{
            if(state.grpNewMsgs.includes(action.payload)){
                state.grpNewMsgs.push(action.payload)
            }
        },
        addGrpUnseenMsgIds:(state,action)=>{
            if(!state.grpUnseenMsgIds.includes(action.payload)){
                state.grpUnseenMsgIds.push(action.payload)
            }
        },
        setGrpUnseenMsgIds:(state,action)=>{
            state.grpUnseenMsgIds = action.payload
        },
        clearGrpUnseenMsgIds:(state)=>{
            state.grpUnseenMsgIds = []
        }
    }
})

export const {
    setOnlineUsers,
    setMessages,
    addMessages,
    setNewMessages,
    addNewMessages,
    setUnseenMsgIds,
    addUnseenMsgIds,
    clearUnseenMsgIds,

    setSelectedGroup,
    setGrpNewMessages,
    addGrpNewMessages,
    addGrpUnseenMsgIds,
    setGrpUnseenMsgIds,
    clearGrpUnseenMsgIds
    
} = chatSlice.actions

export default chatSlice.reducer