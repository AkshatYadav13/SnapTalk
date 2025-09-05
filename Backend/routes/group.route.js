import express from 'express'
import upload from '../middlewares/multer.js'
import { isloggedIn } from '../middlewares/isloggedIn.js'
import { addMember, changeGroupPermissions, createGroup, deleteGroup, editGroup, getAllGrpNewMsg, getGroupDetails, getGroupMessages, leaveGroup, removeMember, sendGrpMessage, toggleAdminStatus, updateGrpMsgStatus, updateNotificationStatus } from '../controllers/group.controller.js'

const router = express.Router()

router.route('/create').post(upload.single('icon'),isloggedIn,createGroup)
router.route('/get/:id').get(isloggedIn,getGroupDetails)
router.route('/admin/toggle/:id/:userId').get(isloggedIn,toggleAdminStatus)
router.route('/addMember/:id/').post(isloggedIn,addMember)
router.route('/removeMember/:id/:userId').get(isloggedIn,removeMember)
router.route('/grpPermissions/change/:id').post(isloggedIn,changeGroupPermissions)
router.route('/edit/:id').post(upload.single('icon'),isloggedIn,editGroup)
router.route('/msg/send/:id').post(isloggedIn,sendGrpMessage)
router.route('/msgs/get/:id').get(isloggedIn,getGroupMessages)
router.route('/msgs/status/update/:id').post(isloggedIn,updateGrpMsgStatus)
router.route('/all/msgs/get/new').get(isloggedIn,getAllGrpNewMsg)
router.route('/leave/:id/').get(isloggedIn,leaveGroup)
router.route('/delete/:id/').get(isloggedIn,deleteGroup)
router.route('/notification/status/update/:id').get(isloggedIn,updateNotificationStatus)

export default router