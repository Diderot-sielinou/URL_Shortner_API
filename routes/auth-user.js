import express from'express';
import { registerUsertValidate } from '../validators/auth-users-validators.js';
import { registerUserHandle } from '../controller/register-controller.js';
const router = express.Router();

/* GET users listing. */
router.get('/register', registerUsertValidate,registerUserHandle);

export default router;
