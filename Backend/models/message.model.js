import mongoose from 'mongoose'

const messageScehema = new mongoose.Schema({
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    receiverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    message:{
        type:String,
        required:true
    },
    status:{
        type:String,
        default:'sent',
        enum:['sent','delivered','seen']
    }
},{timestamps:true})

export const Message = mongoose.model("Message",messageScehema)