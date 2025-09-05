import mongoose from "mongoose"
import { Conversation } from "../models/conversation.model.js"
import { Message } from "../models/message.model.js"
import {getUserSocketId, io} from '../socket io/socket.js'

export async function sendMessage(req,res) {
    try {
        const senderId = req.id
        const receiverId = req.params.id
        const {message} = req.body

        let conversation = await Conversation.findOne({
          participants:{$all:[senderId,receiverId]}  
        })
        if(!conversation){
            conversation = await Conversation.create({
                participants:[senderId,receiverId],
            })
        }
        const newMsg = await Message.create({
            senderId,
            receiverId,
            message,
            status: 'sent',
        })
        if(newMsg) conversation.messageId.push(newMsg._id);

        await Promise.all([conversation.save(),newMsg.save()])

        // socket io
        const receiverSocketId = getUserSocketId(receiverId)
        if(receiverSocketId){
            newMsg.status = 'delivered'
            await newMsg.save()
            io.to(receiverSocketId).emit('newMessage',newMsg)
        }

        return res.status(200).json({
            newMsg,
            success:true
        })
    } catch (error) {
        console.log(error)
    }
}

export async function getMessages(req,res) {
    try {
        const clientId = req.id   
        const userId = req.params.id

        const conversation = await Conversation.findOne({
            participants:{$all:[clientId,userId]}
        }).populate('messageId')


        if(!conversation){
            return res.status(200).json({
                messages:[],
                success:true
            })
        }
        return res.status(200).json({
            messages:conversation.messageId,
            success:true
        })
    } catch (error) {
        console.log(error)
    }    
}

export async function getAllNewMsg(req,res){
    try {
        const clientId = req.id

        const newMessage = await Message.find({
            receiverId:clientId,
            status:{$in:['sent']}
        })

        const newMsgIds = newMessage.map(m=> m._id)

        if(!newMessage){
            return res.status(200).json({
                newMessage:[],
                success:true
            })
        }

        await Message.updateMany(
            {_id:{$in:newMsgIds}},
            {$set:{status:'delivered'} }
        )

        const senderIds = [...new Set(newMessage.map(m => m.senderId))];

        const senderSocketId = senderIds.map(sId => getUserSocketId(sId))

        io.to(senderSocketId).emit('updateStatus',newMsgIds,'delivered')

        return res.status(200).json({
            newMessage,
            success:true
        })
    } catch (error) {
        console.log(error)
    }
}


export async function updateStatus(req,res) {
    try {
        const clientId = req.id
        const userId = req.params.id
        const {unseenMsgIds} = req.body

        const objectIdArr = unseenMsgIds.map(id => new mongoose.Types.ObjectId(id));

        await Message.updateMany(
            {_id: {$in:objectIdArr}},
            {$set:{status:'seen'}}
        )

        const uSocketId = getUserSocketId(userId)
        const cSocketId = getUserSocketId(clientId)

        io.to(uSocketId).emit('updateStatus',unseenMsgIds,'seen')
        io.to(cSocketId).emit('updateStatus',unseenMsgIds,'seen')

        return res.status(200).json({
            message:'status updated successfully',
            success:true
        })

    } catch (error) {
        console.log(error)
    }
} 


