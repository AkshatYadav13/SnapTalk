import { User } from "../models/user.model.js"
import { Notification } from "../models/notification.model.js";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import getDataUri from "../utils/datauri.js"
import cloudinary, { deleteItemFromCloudinary } from "../utils/cloudinary.js"
import {  getUserSocketId, userSocketMap } from "../socket io/socket.js"
import { io } from "../socket io/socket.js"

export async function register(req,res){
    try {
        const {username,email,password} = req.body
        if(!username || !email || !password){
            return res.status(400).json({
                message:'Something is missing',
                success:false
            })
        }
        const user = await User.findOne({email})
        if(user){
            return res.status(400).json({
                message:'Account already exist',
                success:false
            })
        }    
        const hashedPassword = await bcrypt.hash(password,10) 

        const newUser = await User.create({
            username,
            email,
            password:hashedPassword,
        })

        const newUserId = newUser._id

        return res.status(200).json({
            message:'Account created sucessfully.',
            newUserId,
            success:true
        })
    } catch (error) {
        console.log(error)
    }
}

export async function login(req,res) {
    try {
        const {email,password} = req.body
        if(!email || !password){
            return res.status(400).json({
                message:'Something is missing',
                success:false
            })
        }
        let user = await User.findOne({email})
        .populate({path:'posts',createdAt:-1})
        .populate({path:'bookmarks',createdAt:-1})
        .populate({path:'followers',createdAt:-1})
        .populate({path:'following',createdAt:-1})
        .populate({path:'friends',select:'-password' ,createdAt:-1})
        .populate({path:'groupJoined',select:'name icon description onlineMembers',createdAt:-1})

        if(!user){
            return res.status(400).json({
                message:'Invalid Credentials',
                success:false
            })
        }   
        const isPasswordMatch = await bcrypt.compare(password,user.password) 
        if(!isPasswordMatch){
            return res.status(400).json({
                message:'Invalid Credentials',
                success:false
            })
        }

        user = {
            _id:user._id,
            username:user.username,
            email:user.email,
            profilePic:user.profilePic,
            bio:user.bio,
            gender:user.gender,
            followers:user.followers,
            following:user.following,
            friends:user.friends,
            posts:user.posts,
            bookmarks:user.bookmarks,
            groupJoined:user.groupJoined
        }

        const token = jwt.sign({userId:user._id},process.env.SECRET_KEY,{expiresIn:'1d'})
        return res.status(200).cookie('token',token,{httpOnly:true,sameSite:'strict',maxAge:1*24*60*60*1000}).json({
            message:`Welcome back ${user.username}`,
            user,
            success:true
        })
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            message:'Opps something went wrong',
            success:false
        })
    }
}

export async function logout(req,res) {
    try {
     return res.status(200).cookie('token','',{maxAge:0}).json({
        message:'logout successfully',
        success:true
     })   
    } catch (error) {
        console.log(error)
    }
}

export async function getProfile(req,res) {
    try {
        const userId = req.params.id
        const user = await User.findById(userId)
            .select('-password')
            .populate({path:'posts',createdAt:-1})
            .populate({path:'bookmarks',createdAt:-1})
            .populate({path:'followers',createdAt:-1})
            .populate({path:'following',createdAt:-1})
            .populate({path:'friends',createdAt:-1})

        return res.status(200).json({
            user,
            success:true
         })       
    } catch (error) {
        console.log(error)
    }
}

export async function editProfile(req,res) {
    try {
        let cloudResponse;
        const userId = req.params.id
        const {bio,gender} = req.body
        const profilePic = req.file

        const user = await User.findById(userId).select('-password');
        if(!user){
            return res.status(400).json({
                message:'User not found',
                success:false
            })
        }

        if(profilePic){
            deleteItemFromCloudinary(user.profilePic)
            const fileUri = getDataUri(profilePic)
            cloudResponse = await cloudinary.uploader.upload(fileUri)
        }

        if(bio) user.bio = bio
        if(gender) user.gender = gender
        if(profilePic) user.profilePic = cloudResponse.secure_url;
        await user.save()

        return res.status(200).json({
            message:'Profile Updated Successfully',
            user,
            success:true
        })
    } catch (error) {
        console.log(error)
    }
}             

export async function getSuggestedUser(req,res) {
    try {
        const user = await User.findById(req.id)
        const suggestedUser = await User.find({
            _id:{$ne:req.id ,$nin:user.friends.concat(user.following)},
        }
        ).select('-password').limit(10)
        if(!suggestedUser){
            return res.status(400).json({
                message:'no user found currently',
                success:false
            })
        }
        return res.status(200).json({
            suggestedUser,
            success:true
        })
    } catch (error) {
        console.log(error)
    }
}

export async function followOrUnfollow(req,res) {
    try {
        const clientId = req.id
        const userId = req.params.id
        if(!clientId || !userId){
            return res.status(400).json({
                message:'something is missing',
                success:false
            })
        }
        if(clientId === userId){
            return res.status(400).json({
                message:'you can\'t follow yourself',
                success:false
            })
        }
        const client = await User.findOne({_id:clientId})
        const user = await User.findOne({_id:userId})

        const isfollowing = client.following.includes(userId)

        if(isfollowing){
            // unfollow logic
            await Promise.all([
                User.updateOne({_id:clientId},{
                    $pull:{following:userId}
                }),
                User.updateOne({_id:userId},{
                    $pull:{followers:clientId}
                })
            ])

            for(const socktId of Object.values(userSocketMap)){
                if(socktId !== userSocketMap[clientId]){
                    io.to(socktId).emit('updateProfile',client,userId,'unfollow')
                }
            }

            const notification = await Notification.create({
                category:'informative',
                type:'unfollow',
                senderId:clientId,
                receiverId:userId,     
            })
            await notification.populate([
                {path:'senderId',select:'username profilePic'},
                {path:'receiverId',select:'username profilePic'}
            ])

            user.notifications.push(notification._id)
            await user.save()

            const userSocketId = getUserSocketId(userId)
            if(userSocketId){
                notification.status = 'delivered'
                await notification.save()
                io.to(userSocketId).emit('notification',notification)
            }

            return res.status(200).json({
                user,
                type:'unfollow',
                message:"Unfollowed successfully",
                success:true
            })
        }
        else{
            // follow logic
            await Promise.all([
                User.updateOne({_id:clientId},{
                    $push:{following:userId}
                }),
                User.updateOne({_id:userId},{
                    $push:{followers:clientId}
                })
            ])
            
            for(const socktId of Object.values(userSocketMap)){
                if(socktId !== userSocketMap[clientId]){
                    io.to(socktId).emit('updateProfile',client,userId,'follow')
                }
            }

            const notification = await Notification.create({
                category:"informative",
                type:'follow',
                senderId:clientId,
                receiverId:userId,     
            })
            
            await notification.populate([
                {path:'senderId',select:'username profilePic'},
                {path:'receiverId',select:'username profilePic'}
            ])

            user.notifications.push(notification._id)
            await user.save()

            const userSocketId = getUserSocketId(userId)
            if(userSocketId){
                notification.status = 'delivered'
                await notification.save()
                io.to(userSocketId).emit('notification',notification)
            }

            return res.status(200).json({
                user,
                type:'follow',
                message:"followed successfully",
                success:true
            })
        }
    } catch (error) {
        console.log(error)
    }
}


