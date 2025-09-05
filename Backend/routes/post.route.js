import express from 'express'
import { addComment, addNewPost, bookmarkPost, deletePost, dislikePost, getAllPost, getPostComments, getUserPosts, likePost } from '../controllers/post.controller.js'
import upload from '../middlewares/multer.js'
import { isloggedIn } from '../middlewares/isloggedIn.js'

const router = express.Router()

router.route('/addpost').post(isloggedIn,upload.single('media'),addNewPost)
router.route('/all').get(isloggedIn,getAllPost)
router.route('/userpost/all').get(isloggedIn,getUserPosts)
router.route('/like/:id').get(isloggedIn,likePost)
router.route('/dislike/:id').get(isloggedIn,dislikePost)
router.route('/addComment/:id').post(isloggedIn,addComment)
router.route('/getComments/:id').get(isloggedIn,getPostComments)
router.route('/delete/:id').get(isloggedIn,deletePost)
router.route('/bookmark/:id').get(isloggedIn,bookmarkPost)

export default router