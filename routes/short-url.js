import express from 'express'
import { createShortLinkValidator, readShortCodeValidator } from '../validators/short-link.validator.js'
import { createShortUrlHandle, getAllShortUrlByUser, getShortUrlStats } from '../controller/short-link-controller.js'
import authMiddleware from '../middleware/authmiddleware.js'
const router = express.Router()

router.post('/shorten',authMiddleware,createShortLinkValidator,createShortUrlHandle)
router.get('/my-urls',authMiddleware,getAllShortUrlByUser)
router.get('/shorten/:shortCode/stats',authMiddleware,getShortUrlStats)


export default router