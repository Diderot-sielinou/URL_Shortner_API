import express from 'express'
import { createShortLinkValidator } from '../validators/short-link.validator.js'
import { createShortUrlHandle } from '../controller/create-short-link-controller.js'
import authMiddleware from '../middleware/authmiddleware.js'
const router = express.Router()

router.post('/shorten',authMiddleware,createShortLinkValidator,createShortUrlHandle)

export default router