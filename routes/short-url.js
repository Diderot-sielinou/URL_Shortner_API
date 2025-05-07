import express from 'express'
import { createShortLinkValidator } from '../validators/short-link.validator.js'
import { createShortUrlHandle, getAllShortUrlByUser } from '../controller/short-link-controller.js'
import authMiddleware from '../middleware/authmiddleware.js'
const router = express.Router()

router.post('/shorten',authMiddleware,createShortLinkValidator,createShortUrlHandle)
router.get('/my-urls',authMiddleware,getAllShortUrlByUser)

export default router