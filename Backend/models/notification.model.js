import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    category:{
        type:String,
        required:true,
        enum:['informative','request'],        
    },
    type:{
        type:String,
        required:true,
        enum:['like','dislike','follow','unfollow','friend_request','friend_removed','grp_remove'],
    },
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    receiverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true,
    },
    friendReqStatus:{
        type:String,
        enum:['sent','accepted','rejected']
    },
    postId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    group:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    status:{   //for showing total new notifications
        type:String,
        enum:['sent','delivered','seen'],
        default:'sent'
    },
},{timestamps:true})

export const Notification = mongoose.model('Notification',notificationSchema)
