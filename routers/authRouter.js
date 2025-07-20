import express from 'express'
import { signup } from '../controllers/authController.js'
import { signupValidation, handleValidationErrors } from '../middlewares/validation.js'

const router = express.Router()

//signup request with the api/auth/signup
router.post('/signup', signupValidation, handleValidationErrors, signup)

export default router