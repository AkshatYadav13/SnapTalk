import  mongoose, { isValidObjectId } from "mongoose"
import { Group } from "../models/group.model.js"
import { GroupMessage } from "../models/groupMsg.model.js"
import { User } from "../models/user.model.js"
import cloudinary, { deleteItemFromCloudinary } from "../utils/cloudinary.js"
import getDataUri from "../utils/datauri.js"
import { getUserSocketId, io } from "../socket io/socket.js"
import { Notification } from "../models/notification.model.js";


export async function createGroup(req,res) {
    // await Group.deleteMany()
    // await User.updateMany({
    //     $set:{groupJoined:[]}
    // })
    // return
    try {
        const clientId = req.id
        const {memberIds,name,description} = req.body
        const icon = req?.file

        const memberIdArr = memberIds.split(',')

        if(!memberIds || !name){
            return res.status(400).json({
                message:'Member IDs and group name are required',
                success:false
            })
        }

        const newGroup = await Group.create({
            name,
            description,
            createdBy:clientId
        })

        newGroup.members.push(
            {memberId:clientId,role:'admin'},
            ...memberIdArr.map(memberId=>(
                {memberId}
            ))
        )
        
        if(icon){
            const fileUri = getDataUri(icon)
            const cloudResponse = await cloudinary.uploader.upload(fileUri)
            newGroup.icon = cloudResponse.secure_url
        }


        const client = await User.findById(clientId)
        client.groupJoined.push(newGroup._id)
        await client.save()

        await User.updateMany(
            {_id:{$in:memberIdArr}},
            {$push:{groupJoined:newGroup._id}}
        )

        const allmembers = [...memberIdArr,clientId]

        newGroup.notifications.push(
            { 
                type:'create_grp',
                author:clientId,
                status:[...allmembers.map(mId=>( {userId:mId}) )]
            },
            ...memberIdArr.map(mId=>(
                {
                    type:'add',
                    author:clientId,
                    user:mId, 
                    status:[...allmembers.map(mId=>( {userId:mId}) )]
                }
            ))
        )


        await newGroup.save()

        const group = {
            _id:newGroup._id,
            name:newGroup.name,
            icon:newGroup.icon
        }

        for(const mId of memberIdArr){
            const userSocketId = getUserSocketId(mId)
            if(userSocketId){
                io.to(userSocketId).emit('newGroup',group)
            }
        }

        return res.status(200).json({
            message:'group created successfully',
            group,
            success:true
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'An error occurred while creating a group',
            success: false,
        });
    }
}

export async function getGroupDetails(req,res) {
    try {
        const clientId = req.id
        const groupId = req.params.id

        const group = await Group.findById(groupId)
        .populate(
            {path:"createdBy", select:"username profilePic"}
        )
        .populate(
            {path:'members.memberId',select:'username profilePic'},
        ).populate({
            path:'chat',
            populate:[
                {path:'senderId',select:'username profilePic'},
                {path:'status.userId',select:'username profilePic'},
            ]
        }).populate({
            path:'notifications',
            populate:[
                {path:'author',select:'username'},
                {path:'user',select:'username'},
            ]  
        })

        if(!group){
            return res.status(400).json({
                message:'group not found',
                success:false
            })
        }
        const memberIds = group.members.map(m=> m.memberId  && m.memberId._id.toString() )

        if(!memberIds.includes(clientId)){
            return res.status(400).json({
                message:'you are not a part of group',
                success:false
            })
        }

        const userJoinedDate = new Date( 
            group.members.filter(m=>
                m.memberId._id.toString() === clientId
            )[0]?.joinedAt
        )

        // sending only those msgs that are made after this user joined. So that user not able to see msgs that are made before its joining 
        group.chat = group.chat.filter(c=>
            new Date(c.createdAt) >= userJoinedDate
        )

        // same for notification as messages
        group.notifications = group.notifications.filter(n=>
            new Date(n.createdAt) >= userJoinedDate
        )

        // first all admin are shown then members, and all admin and members are stored internally on their joining date 
        group.members.sort((a, b) => {
            if (a.role === 'admin' && b.role === 'member') return -1;
            if (a.role === 'member' && b.role === 'admin') return 1;

            return new Date(a.joinedAt) - new Date(b.joinedAt);
        });

        return res.status(200).json({
            group,
            success: true,
        });

        
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            message:'An error occured while fetching group',
            success: false,
        });
    }
}

export async function toggleAdminStatus(req,res) {
    try {
        const clientId = req.id
        const userId = req.params.userId
        const groupId = req.params.id

        const group = await Group.findById(groupId)
        if(!group){
            return res.status(400).json({
                message:'group not found',
                success:false
            })
        }

        const client =  group.members.find((m)=> m.memberId.toString()===clientId)

        if(!client || client.role!=='admin'){
            return res.status(400).json({
                message:'only admin can perform this action',
                success:false
            })
        }

        const user =  group.members.find((m)=> m.memberId.toString()===userId)

        if(!user){
            return res.status(400).json({
                message:'user is not a part of group',
                success:false
            })
        }

        const allmembers = await group.members.map(m=> m.memberId.toString())

        if(user.role==='admin'){
            user.role = 'member'
            await group.save()

            const notificationObj = {
                type:'dismiss_admin',
                author:clientId,
                user:userId,
                status:[...allmembers.map(mId=>( {userId:mId}) )]
            }
            group.notifications.push(notificationObj)
            await group.save()

            const notification = await Group.findById(group._id) 
            .select('notifications') 
            .populate({
                path: 'notifications', 
                populate: [
                    { path: 'author', select: 'username' }, 
                    { path: 'user', select: 'username' },
                ],
            });
        
            const newNotification = notification.notifications[notification.notifications.length - 1]; 

            for(const mId of allmembers.filter(m=> m!==clientId)){
                const socketId = getUserSocketId(mId)
                if(socketId){
                    io.to(socketId).emit('newGrpNotification',{newNotification})
                }
            }

            return res.status(200).json({
                message:'User is no longer an admin.',
                newNotification,
                success:true
            })
        }
        else{
            user.role = 'admin'
            await group.save()

            const notificationObj = {
                type:'make_admin',
                author:clientId,
                user:userId,
                status:[...allmembers.map(mId=>( {userId:mId}) )]
            }
            group.notifications.push(notificationObj)
            await group.save()

            const notification = await Group.findById(group._id) 
            .select('notifications') 
            .populate({
                path: 'notifications', 
                populate: [
                    { path: 'author', select: 'username' }, 
                    { path: 'user', select: 'username' },
                ],
            });
        
            const newNotification = notification.notifications[notification.notifications.length - 1]; 

            for(const mId of allmembers.filter(m=> m!==clientId)){
                const socketId = getUserSocketId(mId)
                if(socketId){
                    io.to(socketId).emit('newGrpNotification',{newNotification})
                }
            }

            return res.status(200).json({
                message:'User has been promoted to an admin role.',
                newNotification,
                success:true
            })
        }

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'An error occurred while updating admin status',
            success: false,
        });
    }
}

export async function addMember(req,res) {
    try {
        const clientId = req.id
        const {userEmail} = req.body
        const groupId = req.params.id

        const group = await Group.findById(groupId)

        if(!group){
            return res.status(400).json({
                message:'group not found',
                success:false
            })
        }
        const user = await User.findOne({email:userEmail})
        if(!user){
            return res.status(400).json({
                message:'user not found',
                success:false
            })
        }

        const userId = user._id

        const onlyAdminCan =  group.groupPermissions.add_members === 'off'

        if(onlyAdminCan){
            const client =  group.members.find(m=> m.memberId.toString()===clientId)
            if(client.role==='member'){
                return res.status(400).json({
                    message:'only admins can add members',
                    success:false
                })
            }
        }

        if(group.members.map(m=> m.memberId.toString()).includes(userId)){
            return res.status(300).json({
                message:'user already present in group',
                success:false
            })
        }
        
        group.members.push({
            memberId:userId,
            role:'member'
        })
        await group.save()

        user.groupJoined.push(groupId)
        await user.save()
        
        const allmembers =  group.members.map(m=> m.memberId.toString())

        await group.populate(
            {path:'members.memberId',select:'username profilePic'},
        )

        const notificationObj = {
            type:'add',
            author:clientId,
            user:userId,
            status:[...allmembers.map(mId=> ({userId:mId}) )]
        }

        group.notifications.push(notificationObj)
        await group.save()

        const notification = await Group.findById(groupId).select('notifications')
            .populate({
                path: 'notifications', 
                populate: [
                    { path: 'author', select: 'username' }, 
                    { path: 'user', select: 'username' },
                ],
            });            

        const newNotification = notification.notifications[notification.notifications.length-1]
        const userSocketId = getUserSocketId(userId)

        for(const mId of allmembers.filter(m=> m!==userId)){
            const socketId = getUserSocketId(mId)
            if(socketId){
                mId!==clientId && io.to(socketId).emit('newGrpNotification',{newNotification,'details':group.members})
                if(userSocketId){
                    io.to(socketId).emit('grpOnlineMember',{'action':'push',groupId,userId})
                }
            }
        }

        if(userSocketId){
            group.onlineMembers.push(userId)
            await group.save()

            io.to(userSocketId).emit('newGroup',{
                _id:group._id,
                name:group.name,
                icon:group.icon,
                onlineMembers:group.onlineMembers
            })
        }


        return res.status(200).json({
            message:'user added to group successfully',
            success:true,
            'grpMembers':group.members,
            newNotification
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'An error occurred while adding a user',
            success: false,
        });
    }
}

export async function removeMember(req,res) {
    try {
        const clientId = req.id
        const userId = req.params.userId
        const groupId = req.params.id

        if(!isValidObjectId(userId)){
            return res.status(400).json({
                message: 'invalid object id',
                success: false,
            });
        }

        const group = await Group.findById(groupId)
        const user = await User.findById(userId)

        if (!group) {
            return res.status(400).json({
                message: 'Group not found',
                success: false,
            });
        }
        if (!user) {
            return res.status(400).json({
                message: 'User not found',
                success: false,
            });
        }
        
        const client =  group.members.find(m=> m.memberId.toString()===clientId)

        if(client.role==='member'){
            return res.status(400).json({
                message:'only admins can remove members',
                success:false
            })
        }

        if(!group.members.map(m=> m.memberId.toString()).includes(userId)){
            return res.status(400).json({
                message:'user is not a part of group',
                success:false
            })
        }


        group.members = group.members.filter(m=>
            m.memberId.toString()!==userId
        )
        await group.save()

        user.groupJoined.pull(groupId)
        await user.save()

        const allmembers =  group.members.map(m=> m.memberId.toString())

        //notification 
        const notificationObj = {
            type:'remove',
            author:clientId,
            user:userId,
            status:[...allmembers.map(mId=> ({userId:mId}) )]
        }

        group.notifications.push(notificationObj)
        await group.save()

        const notification = await Group.findById(groupId).select('notifications')
            .populate({
                path: 'notifications', 
                populate: [
                    { path: 'author', select: 'username' }, 
                    { path: 'user', select: 'username' },
                ],
            });            

        const newNotification = notification.notifications[notification.notifications.length-1]

        for(const mId of allmembers){
            const socketId = getUserSocketId(mId)
            if(socketId){
                mId!==clientId && io.to(socketId).emit('newGrpNotification',{newNotification,'details':groupId})
                io.to(socketId).emit('grpOnlineMember',{'action':'pull',groupId,userId})
            }
        }

        const removeNotification = await Notification.create({
            category:'informative',
            type:'grp_remove',
            senderId:clientId,
            receiverId:userId,
            group:groupId
        })

        await removeNotification.populate([
            {path:'senderId',select:'username profilePic'},
            {path:'receiverId',select:'username profilePic'},
            {path:'group',select:'name'}
        ])

        user.notifications.push(removeNotification._id)
        await user.save()

        const userSocketId = getUserSocketId(userId)
        if(userSocketId){
            group.onlineMembers.pull(userId)
            await group.save()
            removeNotification.status = 'delivered'
            await removeNotification.save()
            io.to(userSocketId).emit('notification',{'notification':removeNotification})    
        }


        return res.status(200).json({
            message:'user removed from group successfully',
            success:true,
            newNotification
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'An error occurred while removing a user',
            success: false,
        });
    }
}

export async function changeGroupPermissions(req,res) {
    try {
        const clientId = req.id
        const groupId = req.params.id
        const {edit_grp_setting,send_msg,add_members} = req.body

        const group = await Group.findById(groupId)

        if(!group){
            return res.status(400).json({
                message:'group not found',
                success:false
            })
        }

        const client = group.members.find(m=> m.memberId.toString()===clientId)
        if(client.role==='member'){
            return res.status(400).json({
                message:'only admins can change group permissions',
                success:false
            })
        }
        let operations=[]

        if(edit_grp_setting){
            group.groupPermissions.edit_grp_setting = edit_grp_setting
            operations.push('edit_grp')
        } 
        if(send_msg) {
            group.groupPermissions.send_msg = send_msg
            operations.push('send_msg')
        }   
        if(add_members){
            group.groupPermissions.add_members = add_members
            operations.push('add_members')
        }   
        await group.save()

        const allmembers = group.members.map(m=> m.memberId.toString())
        const notificationArr =[]
        for(let i=0; i<operations.length;i++){
            const notificationObj = {
                type:operations[i],
                author:clientId,
                status:[...allmembers.map(mId=> ({userId:mId}))]            
            }
    
            group.notifications.push(notificationObj)
            await group.save()

            const notification = await Group.findById(groupId).select('notifications')
            .populate({
                path: 'notifications', 
                populate: [
                    { path: 'author', select: 'username' }, 
                ],
            });            

            const newNotification = notification.notifications[notification.notifications.length-1]
            notificationArr.push(newNotification)

            for(const mId of allmembers.filter(m=> m!==clientId)){
                const socketId = getUserSocketId(mId)
                if(socketId){
                    io.to(socketId).emit('newGrpNotification',{newNotification})
                }
            }
        }


        return res.status(200).json({
            message:'Group Permissions changed Successfully',
            updatedPermissions:group.groupPermissions,
            notificationArr,
            success:true
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'An error occurred while changing group permissions',
            success: false,
        });
    }
}

export async function editGroup(req,res) {
    try {
        const clientId = req.id
        const groupId = req.params.id
        const {name,description} = req.body
        const icon = req?.file 

        if(!groupId){
            return res.status(400).json({
                message:'something is missing',
                success:false
            })
        }

        const group = await Group.findById(groupId)

        if(!group){
            return res.status(400).json({
                message:'group not found',
                success:false
            })
        }

        const onlyAdminCan =  group.groupPermissions.edit_grp_setting === 'off'

        if(onlyAdminCan){
            const client = group.members.find(m=> m.memberId.toString()===clientId)
            if(client.role==='member'){
                return res.status(400).json({
                    message:'only admins can edit group',
                    success:false
                })
            }
        }

        let cloudResponse
        if(icon){
            deleteItemFromCloudinary(group.icon)
            const fileUri = getDataUri(icon)
            cloudResponse = await cloudinary.uploader.upload(fileUri)
        }

        let operations=[]

        if(name){
            group.name = name
            operations.push('name')
        } 
        if(description){
            group.description = description
            operations.push('description')
        } 
        if(icon){
            group.icon = cloudResponse.secure_url
            operations.push('icon')
        }  
        await group.save()


        const allmembers = group.members.map(m=> m.memberId.toString())
        const notificationArr =[]
        for(let i=0; i<operations.length;i++){
            const notificationObj = {
                type:operations[i],
                author:clientId,
                status:[...allmembers.map(mId=> ({userId:mId}))]            
            }
    
            group.notifications.push(notificationObj)
            await group.save()

            const notification = await Group.findById(groupId).select('notifications')
            .populate({
                path: 'notifications', 
                populate: [
                    { path: 'author', select: 'username' }, 
                ],
            });            

            const newNotification = notification.notifications[notification.notifications.length-1]
            notificationArr.push(newNotification)

            for(const mId of allmembers.filter(m=> m!==clientId)){
                const socketId = getUserSocketId(mId)
                if(socketId){
                    io.to(socketId).emit('newGrpNotification',{newNotification,'details':
                        operations[i]==='name'? group.name 
                        :operations[i]==='description' ? group.description
                        :group.icon
                    })
                }
            }
        }

        return res.status(200).json({
            message:'Group setting updated successfully',
            ...(icon && {icon:cloudResponse.secure_url}),
            success:true
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'An error occurred while editing group',
            success: false,
        });
    }
}

export async function sendGrpMessage(req,res) {
    try {
        const senderId = req.id
        const groupId = req.params.id
        const {message} = req.body

        const group = await Group.findById(groupId)
        
        const grpMemberIds = group.members.map(m=> m.memberId.toString())
        const otherMemberIds = grpMemberIds.filter(m=> m!==senderId)

        if(!grpMemberIds.includes(senderId)){
            return res.status(400).json({
                message:'user is not part of group',
                success:false
            })
        }

        const onlyAdminCan =  group.groupPermissions.send_msg === 'off'

        if(onlyAdminCan){
            const sender = group.members.find(m=> m.memberId.toString()===senderId)
            if(sender.role==='member'){
                return res.status(400).json({
                    message:'only admins can send messages',
                    success:false
                })
            }
        }

        const statusArray = otherMemberIds.map(m=>(
            {
                userId:m,
                status:'sent'
            } 
        ))

        const grpMessage = await GroupMessage.create({
            groupId,
            senderId,
            message,
            status:statusArray
        })
        await grpMessage.populate([
            {path:'senderId',select:'username profilePic'},
            {path:'status.userId',select:'username profilePic'},
        ])


        group.chat.push(grpMessage._id)
        await group.save()

        for(const mId of otherMemberIds){
            const userSocketId = getUserSocketId(mId)

            if(userSocketId){
                await GroupMessage.updateMany(
                    {'status.userId':mId, _id:grpMessage._id},
                    {$set:{'status.$.status':'delivered'}}
                )
        
                const updatedMessage = await GroupMessage.findById(grpMessage._id).populate([
                    {path:'senderId',select:'username profilePic'},
                    {path:'status.userId',select:'username profilePic'},
                ])

                io.to(userSocketId).emit('newGrpMessage',updatedMessage)
            }
        }
        
        const updatedMessage = await GroupMessage.findById(grpMessage._id).populate([
            {path:'senderId',select:'username profilePic'},
            {path:'status.userId',select:'username profilePic'},
        ])

        return res.status(200).json({
            message:'message sent successfully',
            'grpMessage':updatedMessage,
            success:true
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'An error occurred while sending message in group',
            success: false,
        });
    }
}

export async function getGroupMessages(req,res) {
    try {
        const clientId = req.id
        const groupId = req.params.id

        const group = await Group.findById(groupId)

        if(!group){
            return res.status(400).json({
                message:'group not found',
                success:false
            })
        }

        if(!group.members.map(m=> m.memberId.toString()).includes(clientId)){
            return res.status(400).json({
                message:'you are not a part of group',
                success:false
            })
        }

        const client = await group.members.find(m=> m.memberId.toString()===clientId)

        let messages
        if(client.role==='admin'){
            messages = await GroupMessage.find({
                groupId,
            })
            .sort({createdAt:1})
            .populate([
                {path:'senderId',select:'username profilePic'},
                {path:'status.userId',select:'username profilePic'},
            ])
        }
        else{
            messages = await GroupMessage.find({
                groupId,
                createdAt:{$gt:client.joinedAt}
            })
            .sort({createdAt:1})
            .populate([
                {path:'senderId',select:'username profilePic'},
                {path:'status.userId',select:'username profilePic'},
            ])
        }

        return res.status(200).json({
            messages,
            success:true
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'An error occurred while fetching group messages',
            success: false,
        });
    }
}

export async function updateGrpMsgStatus(req,res) {
    try {
        const clientId = req.id
        const groupId = req.params.id
        const {msgIds} = req.body

        if(!groupId || msgIds.length<1){
            return res.status(400).json({
                message:'something is missing',
                success:false
            })
        }

        const group = await Group.findById(groupId)
        const msg = await GroupMessage.findById(msgIds[0])

        if(!group){
            return res.status(400).json({
                message:'group not found',
                success:false
            })
        }
        if(!group.members.map(m=> m.memberId.toString()).includes(clientId)){
            return res.status(400).json({
                message:'user is not part of group',
                success:false
            })
        }

        const updatedMessages =  await GroupMessage.updateMany(
            {
                _id:{$in:msgIds},
                'status.userId':clientId
            },
            {
                $set:{'status.$.status':"seen"}
            }
        )

        const senderSocketId = getUserSocketId(msg.senderId)
        if(senderSocketId){
            io.to(senderSocketId).emit('updateGrpMsgStatus',msgIds,'seen',clientId)
        }

        return res.status(200).json({
            message:'Message status updated successfully',
            updatedCount:updatedMessages.modifiedCount,
            success:true
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'An error occurred while updating message status',
            success: false,
        });
    }
}

export async function getAllGrpNewMsg(req,res) {
    // await Group.updateMany({
    //     chat:[]
    // })
    // return
    try {
        const clientId = req.id

        const newMsg = await GroupMessage.find(
            {'status.userId':clientId,
            'status.status':'sent'}
        )

        await GroupMessage.updateMany(
            {'status.userId':clientId, 'status.status':'sent'},
            {$set:{'status.$.status':'delivered'}}
        )

        return res.status(200).json({
            newMsg,
            success:true
        })

    } catch (error) {
        console.log(error)
    }
}

export async function leaveGroup(req,res) {
    try {
        const clientId = req.id
        const groupId = req.params.id

        const group = await Group.findById(groupId)
        if (!group) {
            return res.status(400).json({
                message: 'Group not found',
                success: false,
            });
        }
        const grpMemberIds = group.members.map(m=> m.memberId.toString())

        if(!grpMemberIds.includes(clientId)){
            return res.status(400).json({
                message:'user is not part of group',
                success:false
            })
        }

        const isOtherAdmin = group.members.some(m=> m.role==='admin' && m.memberId.toString()!=clientId)

        if(!isOtherAdmin){
            return res.status(401).json({
                message:'You\'re the only admin. Assign another admin before leaving.',
                success:false
            })
        }
        else{
            
            const allmembers = group.members.map(m=> m.memberId.toString())

            const notificationObj = {
                type:'leave',
                user:clientId,
                status:[...allmembers.filter(m=> m!==clientId).map(mId=> ({userId:mId}) )]
            }
            group.notifications.push(notificationObj)
            await group.save()
    

            const notification = await Group.findById(groupId).select('notifications')
            .populate({
                path: 'notifications', 
                populate: [
                    { path: 'author', select: 'username' }, 
                    { path: 'user', select: 'username' },
                ],
            });            

            const newNotification = notification.notifications[notification.notifications.length-1]

            for(const mId of allmembers){
                const socketId = getUserSocketId(mId)
                if(socketId){
                    io.to(socketId).emit('newGrpNotification',{newNotification,'details':groupId})
                    mId!=clientId &&  io.to(socketId).emit('grpOnlineMember',{'action':'pull',groupId,clientId})
                }
            }

            group.onlineMembers.pull(clientId)

            group.members = group.members.filter(m=>
                m.memberId.toString()!==clientId
            )
            await group.save()
    
            const client = await User.findById(clientId)
            client.groupJoined.pull(groupId)
            await client.save()

            return res.status(200).json({
                message:'group leaved successfully',
                success:true
            }) 
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'An error occurred while leaving the group',
            success: false,
        });   
    }
}

export async function deleteGroup(req,res) {
    try {
        const clientId = req.id
        const groupId = req.params.id

        const group = await Group.findById(groupId)
        if (!group) {
            return res.status(400).json({
                message: 'Group not found',
                success: false,
            });
        }
        const grpMemberIds = group.members.map(m=> m.memberId.toString())

        if(!grpMemberIds.includes(clientId)){
            return res.status(400).json({
                message:'user is not part of group',
                success:false
            })
        }
        if(grpMemberIds.length>1){
            return res.status(400).json({
                message:'First remove all other members',
                success:false
            })
        }

        const client = group.members.find(m=>m.memberId.toString()===clientId)

        if(client.role==='member'){
            return res.status(401).json({
                message:'only admins can perform this action',
                success:false
            })
        }
        else{
            deleteItemFromCloudinary(group.icon)

            await GroupMessage.deleteMany({
                _id:{$in:group.chat}
            })

            await Group.findByIdAndDelete(groupId)

            const client = await User.findById(clientId)
            client.groupJoined.pull(groupId)
            await client.save()

    
            return res.status(200).json({
                message:'group delete successfully',
                success:true
            }) 
        }
    } catch (error) {
        console.log(error)
        return res.status(500).json({
            message: 'An error occurred while deleting the group',
            success: false,
        });   
    }
}

export async function updateNotificationStatus(req,res) {
    try {
        const clientId = req.id
        const groupId = req.params.id

        const group = await Group.findById(groupId)
        if(!group){
            return res.status(400).json({
                message:'group not found',
                success:false
            })
        }

        const updatedNotification =  await Group.updateMany(
            {
                _id: groupId,
            },
            {
                $set: { 'notifications.$[notification].status.$[status].status': 'seen' }
            },
            {
                arrayFilters: [
                    { 'notification.status.userId': clientId },
                    { 'status.userId': clientId }
                ]
            }
        );

        const allmember = group.members.map(m=> m.memberId.toString())

        // remove a notification when all user sees it..
        group.notifications = group.notifications.filter(n=>
            !n.status.every(u=> ( u.status === 'seen' || (u.status === 'unseen' && !allmember.includes(u.userId.toString() )) ))
        )

        await group.save()

        return res.status(200).json({
            message:'Notification status updated successfully',
            success:true
        })

        //some() returns true if at least one element satisfies the condition else false
        //every() returns true if all element satisfies the condition else false

    } catch (error) {
        console.log(error)
    }
}