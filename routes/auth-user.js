import express from'express';
import { loginUserValidator, registerUsertValidate } from '../validators/auth-users-validators.js';
import { registerUserHandle } from '../controller/register-controller.js';
import { loginUserHandle } from '../controller/login-user-controller.js';
const router = express.Router();

/* GET users listing. */
router.post('/register', registerUsertValidate,registerUserHandle);
router.post('/login', loginUserValidator,loginUserHandle);


export default router;
