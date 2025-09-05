import mongoose from 'mongoose';

const groupMessageSchema = new mongoose.Schema({
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: [{
        userId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:'User'
        },
        status:{
            type:String,
            enum: ['sent', 'delivered', 'seen'],
            default: 'sent',
        },
    }]
}, { timestamps: true });

export const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);
