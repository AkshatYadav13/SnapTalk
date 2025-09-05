import { io } from "../socket io/socket.js"
import {  getUserSocketId } from "../socket io/socket.js"
import { User } from "../models/user.model.js"
import { Notification } from "../models/notification.model.js";


export async function getNotifications(req,res) {
    try {
        const clientId = req.id

        const notifications = await Notification.find({
            $or:[
            {$and:[{type:{$ne:'friend_request'}},{receiverId:clientId}]},
            {$and:[{type:"friend_request"},{senderId:clientId}]},
            {$and:[{type:"friend_request"},{receiverId:clientId},{friendReqStatus:'sent'}]}
            ]
        })
        .populate([
            {path:'senderId',select:'username profilePic'},
            {path:'receiverId',select:'username profilePic'},
            {path:'postId'},
            {path:'group',select:'name'}
        ])

        await Notification.updateMany(
            {receiverId:clientId,status:'sent'},
            {$set:{status:'delivered'}}
        )

        return res.status(200).json({
            notifications,
            success:true,
        })

    } catch (error) {
        console.log(error)
    }
}

export async function deleteNotifications(req,res){
    // await User.updateMany({
    //     $set:{
    //         notifications:[],
    //         followers:[],
    //         following:[],
    //         friends:[]
    //     }
    // })
    // return
    
    try {
        const clientId = req.id
        const {notificationIds} = req.body


        await Notification.deleteMany(
            {_id:{$in:notificationIds}},
            {receiverId:clientId},
        )

        await User.updateOne(
            {_id:clientId},
            {$pull:{notifications:{$in:notificationIds}}}
        )

        return res.status(200).json({
            success:true,
        })

    } catch (error) {
        console.log(error)
    }
}

export async function sendFriendRequest(req,res){
    try {
        const clientId = req.id
        const userId = req.params.id

        const client = await User.findOne({_id:clientId})
        const user = await User.findOne({_id:userId})

        if(!client || !user){
            return res.status(400).json({
                message:'user not found',
                success:false
            })
        }

        const notification= await Notification.create({
          category:"request",
          type:'friend_request',
          senderId:clientId,
          receiverId:userId,
          friendReqStatus:'sent'
        })

        await notification.populate([
            {path:'senderId',select:'username profilePic'},
            {path:'receiverId',select:'username profilePic'}
        ])

        client.notifications.push(notification)
        await client.save()

        user.notifications.push(notification)
        await user.save()

        const userSocketId = getUserSocketId(userId)
        if(userSocketId){
            notification.status = 'delivered'
            await notification.save()
            io.to(userSocketId).emit('notification',notification)
        }

        const clientSocketId = getUserSocketId(clientId)
        io.to(clientSocketId).emit('notification',notification)

        return res.status(200).json({
            message:'friend request sent successfully',
            success:true
        })

    } catch (error) {
        console.log(error)
    }

}

export async function acceptRejectFriendReq(req,res) {
    const clientId = req.id
    const userId = req.params.id
    const {action,notificationId} = req.body

    if(!clientId || !userId || !action){
        return res.status(400).json({
            success:false,
            message:'something is missing'
        })
    }
    const client = await User.findById(clientId)
    const user = await User.findById(userId)

    if(action==='accept'){
        client.friends.push(userId)
        await client.save()
        user.friends.push(clientId)
        await user.save()

        const notification = await Notification.findOneAndUpdate(
            {_id:notificationId},
            {$set:{friendReqStatus:'accepted'}},
            {status:'sent'},
            { new: true } 
        ).populate([
            {path:'senderId',select:'username profilePic'},
            {path:'receiverId',select:'username profilePic'},
        ])

        const userSocketId = getUserSocketId(userId)
        if(userSocketId){
            io.to(userSocketId).emit('notification',notification)
            io.to(userSocketId).emit('updateFriendList',{
                'action':'add',
                friend:client
            })
        }

        return res.status(200).json({
            message:'Friend request accepted',
            user,
            success:true
        })
    }
    else if(action==='reject'){
        const notification = await Notification.findOneAndUpdate(
            {_id:notificationId},
            {$set:{friendReqStatus:'rejected'}},
            {status:'sent'},
            { new: true } 
        ).populate([
            {path:'senderId',select:'username profilePic'},
            {path:'receiverId',select:'username profilePic'},
        ])

        const userSocketId = getUserSocketId(userId)
        if(userSocketId){
            io.to(userSocketId).emit('notification',notification)
        }

        return res.status(200).json({
            message:'Friend request rejected',
            user,
            success:true
        })
    }
}

export async function removeFriend(req,res) {
    try {
        const clientId = req.id
        const userId = req.params.id

        const client = await User.findById(clientId)
        const user = await User.findById(userId)
        
        if(!client || !user){
            return res.status(400).json({
                message:'user not found',
                success:false
            })
        }
        client.friends.pull(userId)
        await client.save()
        user.friends.pull(clientId)
        await user.save()

        const notification = await Notification.create({
            category:"informative",
            type:'friend_removed',
            senderId:client,
            receiverId:userId,
        })

        const userSocketId = getUserSocketId(userId)
        if(userSocketId){
            notification.status = 'delivered'
            await notification.save()
            io.to(userSocketId).emit('notification',notification)

            io.to(userSocketId).emit('updateFriendList',{
                'action':'remove',
                friend:client
            })
        }

        return res.status(200).json({
            message:'Friend removed suceefully',
            userId,
            clientId,
            success:true
        })

    } catch (error) {
        console.log(error)
    }
}

export async function updateNotificationStatus(req,res) {
    try {
        const category = req.params.category
        const clientId = req.id

        const notification = await Notification.find({
            category,
            receiverId:clientId,
        })

        if(notification.length>=1){
            const notificationIds = notification.map(n=> n._id)
    
            await Notification.updateMany(
                {_id:{$in:notificationIds}},
                {$set:{status:'seen'}}
            )
    
            return res.status(200).json({
                notificationIds,
                success:true
            })
        }

    } catch (error) {
        console.log(error)
    }
}