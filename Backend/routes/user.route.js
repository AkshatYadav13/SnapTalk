import express from 'express'
import { editProfile, followOrUnfollow, getProfile, getSuggestedUser, login, logout, register} from '../controllers/user.controller.js'
import { isloggedIn } from '../middlewares/isloggedIn.js'
import upload from '../middlewares/multer.js'

const router = express.Router()

router.route('/register').post(register)
router.route('/login').post(login)
router.route('/logout').get(isloggedIn,logout)
router.route('/profile/:id').get(isloggedIn,getProfile)
router.route('/edit/:id').post(upload.single('profilePic'),editProfile)
router.route('/suggested').get(isloggedIn,getSuggestedUser)
router.route('/followOrUnfollow/:id').get(isloggedIn,followOrUnfollow)


export default router
