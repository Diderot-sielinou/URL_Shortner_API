import express from 'express'
import authMiddleware from '../middleware/authmiddleware.js'
import { getInformationAboutUserHandle } from '../controller/user-controller.js'
const router = express.Router()

router.get('/profile',authMiddleware,getInformationAboutUserHandle)

export default router