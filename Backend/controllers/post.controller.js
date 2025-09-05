import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Notification } from "../models/notification.model.js";
import { Comment } from "../models/comment.model.js";
import cloudinary, { deleteItemFromCloudinary } from "../utils/cloudinary.js";
import getDataUri from "../utils/datauri.js";
import { getUserSocketId, io, userSocketMap } from "../socket io/socket.js";

export async function addNewPost(req,res) {
    try {
     const {caption} = req.body;
     const file = req.file
     const userId = req.id   

     if(!file){
        return res.status(400).json({
            message:'Image is required',
            success:false
        })
     }

     const fileUri = getDataUri(file)
     const isVideo = file.mimetype.startsWith('video/')
     const cloudResponse = await cloudinary.uploader.upload(fileUri,{
        resource_type: isVideo? 'video' : 'image'
     })

     const mediaUrl = cloudResponse.secure_url

     const post = await Post.create({
        caption,
        mediaType: isVideo?'video':'image',
        media:mediaUrl,
        author:userId,
     })
     
     const user = await User.findById(userId)
     if(user){
        user.posts.push(post._id)
        await user.save()
     }
     await post.populate({path:'author', select:'-password'})

     for(const socktId of Object.values(userSocketMap)){
        if(socktId !== userSocketMap[userId]){
            io.to(socktId).emit('newPostCreated',post)
        }
     }

     return res.status(200).json({
        message:'New post created successfully',
        post,
        success:true
     })
    } catch (error) {
        console.log(error,error.message)
        return res.status(400).json({
            message:error.message
        })
    }
}

export async function getAllPost(req,res) {
    try {
     const posts = await Post.find()
     .sort({createdAt:-1})
     .populate({path:'author',select:'username profilePic'})   
     .populate({path:'comments',sort:{createdAt:-1},populate:{path:'author',select:'username profilePic'}})

     return res.status(200).json({
        posts,
        success:true
     })
    } catch (error) {
        console.log(error)
    }
}

export async function getUserPosts(req,res){
    try {
        const clientId = req.id;
        
        const posts = await Post.find({author:clientId}).sort({createdAt:-1})
        .populate({path:'author',select:'username profilePic'})
        .populate({path:'comments',sort:{createdAt:-1},populate:{path:'author',select:'username profilePic'}})

        return res.status(200).json({
            posts,
            success:true
         })
    } catch (error) {
        console.log(error)
    }
}

export async function likePost(req,res) {
    const clientId = req.id   
    const postId = req.params.id

    if(!clientId || !postId){
        return res.status(400).json({
            message:'something is missing',
            success:false
        })
    }

    const post = await Post.findById(postId)
    if(!post) return res.status(400).json({
        message:'post not found',
        success:false
    })

    if(post.author._id == clientId){
        return res.status(400).json({
            message:'you can\'t like your own posts',
            success:false
        })
    }

    await post.updateOne({$addToSet:{likes:clientId}})
    await post.save()

    // socket io for real time notification
    const notification = await Notification.create({
        category:"informative",
        type:'like',
        senderId:clientId,
        receiverId:post.author._id,
        postId:post._id
    })

    await notification.populate([
        {path:'senderId',select:'username profilePic'},
        {path:'receiverId',select:'username profilePic'},
        {path:'postId'}
    ])

    const user = await User.findById(post.author?._id)
    user.notifications.push(notification._id)
    await user.save()

    const postOwnerSocketId = getUserSocketId(post.author?._id)
    if(postOwnerSocketId){
        notification.status = 'delivered'
        await notification.save()
        io.to(postOwnerSocketId).emit('notification',notification)
    }

    io.emit('updateData',notification)
    
    return res.status(200).json({
        message:'Post Liked successfully',
        success:true
    })
}

export async function dislikePost(req,res) {
    const clientId = req.id   
    const postId = req.params.id

    if(!clientId || !postId){
        return res.status(400).json({
            message:'something is missing',
            success:false
        })
    }
    const post = await Post.findById({_id:postId})
    if(!post) return res.status(400).json({
        message:'post not found',
        success:false
    })

    if(post.author._id == clientId){
        return res.status(400).json({
            message:'you can\'t dislike your own posts',
            success:false
        })
    }

    await post.updateOne({$pull:{likes:clientId}})
    await post.save()

    // socket io for real time notification

    const notification = await Notification.create({
        category:"informative",
        type:'dislike',
        senderId:clientId,
        receiverId:post.author._id,
        postId:post._id
    })

    await notification.populate([
        {path:'senderId',select:'username profilePic'},
        {path:'receiverId',select:'username profilePic'},
        {path:'postId'}
    ])

    const user = await User.findById(post.author?._id)
    user.notifications.push(notification._id)
    await user.save()

    const postOwnerSocketId = getUserSocketId(post.author?._id)
    
    if(postOwnerSocketId){
        notification.status = 'delivered'
        await notification.save()
        io.to(postOwnerSocketId).emit('notification',notification)
    }

    io.emit('updateData',notification)

    return res.status(200).json({
        message:'Post disliked successfully',
        success:true
    })
}

export async function addComment(req,res) {
    try {
        const postId = req.params.id
        const {message} = req.body

        if(!postId || !message){
            return res.status(400).json({
                message:'something is missing',
                success:false
            })
        }
        const comment = await Comment.create({
            message,
            author:req.id,
            postId
        })

        await comment.populate({ path: 'author', select: 'username profilePic' })

        const post = await Post.findById({_id:postId})
        post.comments.push(comment._id)
        await post.save()

        return res.status(200).json({
            message:'comment added successfully',
            comment,
            success:true
        })
    } catch (error) {
        console.log(error)
    }
}

export async function getPostComments(req,res) {
    try {
        const postId = req.params.id     
        
        const comments = await Comment.find({postId}).populate({path:'author',select:'username profilePic'})
        if(!comments){
            return res.status(400).json({
                message:'no comments found',
                success:false
            })    
        }
        return res.status(200).json({
            comments,
            success:true
        })    
    } catch (error) {
        console.log(error)
    }
}

export async function deletePost(req,res) {
    try {
        const postId  = req.params.id
        const userId = req.id

        const post = await Post.findById(postId)
        if(!post) return res.status(400).json({
            message:'post not found',
            success:false
        })
        if(post.author.toString()!==userId){
            return res.status(400).json({
                message:'user not authentic',
                success:false
            })    
        }
        // delete resource from cloudinary
        deleteItemFromCloudinary(post.media)

        //delete post 
        await Post.findByIdAndDelete(postId)

        // remove postid from user
        const user = await User.findById(userId)   
        user.posts.pull(post._id)
        await user.save()

        // delete related comments
        await Comment.deleteMany({postId})

        for(const socktId of Object.values(userSocketMap)){
            if(socktId !== userSocketMap[userId]){
                io.to(socktId).emit('deletePost',postId)
            }
        }

        return res.status(200).json({
            message:'Post deleted successfully',
            success:true
        })    

    } catch (error) {
        console.log(error)
    }
}

export async function bookmarkPost(req,res) {
    try {
        const postId = req.params.id       
        const userId = req.id

        const user = await User.findById(userId)
        const post = await Post.findById(postId)
        if(!post){
            return res.status(400).json({
                message:'post not found',
                success:false
            }) 
        }
        if(user.bookmarks.includes(postId)){
            user.bookmarks.pull(postId)
            await user.save()
            return res.status(200).json({
                message:'Post removed from bookmark',
                success:true
            })
        }
        else{
            user.bookmarks.push(postId)
            await user.save()
            return res.status(200).json({
                message:'Post added to bookmark',
                success:true
            })
        }
    } catch (error) {
        console.log(error)
    }
}

