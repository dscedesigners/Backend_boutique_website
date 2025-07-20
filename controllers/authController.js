import { signup as signupService } from '../services/authService.js'
import { success } from '../utils/responses.js'


//we have predefined responses in responses file
export async function signup(req, res, next) {
  try {
    //here the request for the signup will raise.
    const result = await signupService(req.body);
    success(res, {
      userId: result.user.id,
      welcomeOffer: result.welcomeOffer
    }, 'Account created successfully', 201);
  } catch (error) {
    next(error);
  }
}
