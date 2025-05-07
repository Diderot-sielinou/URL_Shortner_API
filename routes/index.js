import express from 'express';
import { redirectionShortCodeHandle } from '../controller/short-link-controller.js';
const router = express.Router();

/* GET home page. */
router.get('/:shortCode',redirectionShortCodeHandle);

export default router;
