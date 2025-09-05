import mongoose from 'mongoose'

const conversationScehema = new mongoose.Schema({
    participants:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
    }],
    messageId:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Message',
    }]
},{timestamps:true})

export const Conversation = mongoose.model("Conversation",conversationScehema)