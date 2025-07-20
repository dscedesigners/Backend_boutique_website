import jwt from 'jsonwebtoken'
import User from '../models/userModels.js'
import config from '../config/config.js'

// Generate JWT token for a user
function generateToken(userId) {
  return jwt.sign({ userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRE
  });
}

// Signup logic as given in api.txt
export async function signup(userData) {
  try {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    //if user is not there than saving it
    const user = new User(userData);
    await user.save();

    const token = generateToken(user._id);

    console.log(`New User registered:${user.email}`)
    
    return {
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      },
      token,
      welcomeOffer: "10% off on first purchase"
    };
  } catch (error) {
    console.log(`New User registration error: ${error.message}`)
    throw error;
  }
}