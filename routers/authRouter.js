import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { User } from '../models/userModel.js';
import Otp from '../models/Otp.js';

const router = express.Router();

const {
  FAST2SMS_API_KEY,
  JWT_SECRET,
  JWT_EXPIRY = '1h'
} = process.env;

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send OTP using Fast2SMS
// async function sendOTP(mobile, otp) {
//   const payload = {
//     variables_values: otp,
//     route: 'otp',
//     numbers: mobile
//   };

//   return axios.post(
//     'https://www.fast2sms.com/dev/bulkV2',
//     new URLSearchParams(payload),
//     {
//       headers: {
//         Authorization: FAST2SMS_API_KEY,
//         'Content-Type': 'application/x-www-form-urlencoded',
//       }
//     }
//   );
// }

// Mock Send OTP function (no external API call)
async function sendOTP(mobile, otp) {
  console.log(`Mock OTP sent to ${mobile}: ${otp}`);
  // Simulate async behavior
  return Promise.resolve();
}
// Rate limit OTP sends
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min window
  max: 5,
  message: 'Too many OTP requests. Try again later.'
});

// POST /send-otp
router.post('/send-otp', otpLimiter, async (req, res) => {
  const { mobile } = req.body;
  if (!mobile) return res.status(400).json({ message: 'Mobile number is required' });

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  try {
    // Prevent spamming resend
    const existing = await Otp.findOne({ mobile });
    if (existing && (Date.now() < new Date(existing.expiresAt) - 60 * 1000)) {
      return res.status(429).json({ message: 'Please wait before requesting OTP again' });
    }

    await sendOTP(mobile, otp);
    await Otp.findOneAndDelete({ mobile });
    await Otp.create({ mobile, otp, expiresAt });

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('OTP error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// POST /verify-otp
router.post('/verify-otp', async (req, res) => {
  const { mobile, otp } = req.body;
  if (!mobile || !otp) return res.status(400).json({ message: 'Mobile and OTP required' });

  const record = await Otp.findOne({ mobile });

  if (!record) return res.status(400).json({ message: 'OTP not found or expired' });
  if (record.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });
  if (record.otp !== otp) return res.status(400).json({ message: 'Invalid OTP' });

  let user = await User.findOne({ phone: mobile });
  if (!user) user = await User.create({ phone: mobile });

  await Otp.deleteOne({ mobile });

  const token = jwt.sign({ userId: user._id, mobile: user.phone }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

  res.json({
    message: 'Signup successful',
    token,
    user: { mobile: user.phone }
  });
});

export default router;