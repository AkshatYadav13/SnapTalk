import express from 'express'
import { isloggedIn } from '../middlewares/isloggedIn.js'
import { getAllNewMsg, getMessages, sendMessage, updateStatus } from '../controllers/message.controller.js'

const router = express.Router()

router.route('/send/:id').post(isloggedIn,sendMessage)
router.route('/get/:id').get(isloggedIn,getMessages)
router.route('/new/all').get(isloggedIn,getAllNewMsg)
router.route('/update/status/:id').post(isloggedIn,updateStatus)

export default router
