import express from 'express'
import { isloggedIn } from '../middlewares/isloggedIn.js'
import { acceptRejectFriendReq, deleteNotifications, getNotifications, removeFriend, sendFriendRequest, updateNotificationStatus } from '../controllers/notification.controller.js'

const router = express.Router()

router.route('/get').get(isloggedIn,getNotifications)
router.route('/delete').post(isloggedIn,deleteNotifications)
router.route('/friendReq/send/:id').get(isloggedIn,sendFriendRequest)
router.route('/friendReq/acceptOrReject/:id').post(isloggedIn,acceptRejectFriendReq)
router.route('/updateStatus/:category').get(isloggedIn,updateNotificationStatus)
router.route('/friend/remove/:id').get(isloggedIn,removeFriend)

export default router
