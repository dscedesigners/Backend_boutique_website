import Otp from '../models/otpModel.js';
import { User } from '../models/userModel.js';
import { sendEmail } from '../utiles/nodemailer.js';

// Helper function to generate OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Helper function to send OTP to phone (placeholder)
const sendPhoneOtp = (phone, otp) => {
  console.log(`Sending OTP ${otp} to phone ${phone}`); // Placeholder for SMS service
  // Replace with actual SMS service (e.g., Twilio) implementation
};

export const createOtp = async (req, res) => {
  try {
    console.log('Create OTP called at', new Date().toLocaleString());
    const { contact, purpose } = req.body;
    if (!contact || !purpose || !['signup', 'forgotPassword'].includes(purpose)) {
      return res.status(400).json({ message: 'Valid contact and purpose (signup or forgotPassword) are required' });
    }
    // For forgotPassword, user must exist; for signup, user may not exist
    const user = await User.findOne({ $or: [{ email: contact }, { phone: contact }] });
    if (purpose === 'forgotPassword' && !user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Check for existing valid OTP
    const existingOtp = await Otp.findOne({ contact, purpose, expiresAt: { $gt: new Date() } });
    if (existingOtp) {
      // Delete the existing valid OTP
      await Otp.deleteOne({ _id: existingOtp._id });
    }
    // Generate new OTP and create new record
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await Otp.create({
      contact,
      contactType: contact.includes('@') ? 'email' : 'phone',
      otp,
      purpose,
      expiresAt,
      user: user ? user._id : null,
    });
    // Send the new OTP
    if (contact.includes('@')) {
      await sendEmail(contact, `${purpose} OTP`, `Your OTP for ${purpose} is: ${otp}`);
    } else {
      sendPhoneOtp(contact, otp);
    }
    res.status(201).json({ message: 'OTP created successfully' });
  } catch (error) {
    console.error('Error creating OTP:', error);
    res.status(500).json({ message: 'Error creating OTP', error: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    console.log('Verify OTP called at', new Date().toLocaleString());
    const { contact, otp, purpose } = req.body;
    if (!contact || !otp || !purpose) {
      return res.status(400).json({ message: 'Contact, OTP, and purpose are required' });
    }
    const otpRecord = await Otp.findOne({ contact, otp, purpose, expiresAt: { $gt: new Date() } });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    // OTP is verified here, but we don't delete it; deletion happens in signup/reset-password
    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
};

export const resendOtp = async (req, res) => {
  try {
    console.log('Resend OTP called at', new Date().toLocaleString());
    const { contact, purpose } = req.body;
    if (!contact || !purpose || !['signup', 'forgotPassword'].includes(purpose)) {
      return res.status(400).json({ message: 'Valid contact and purpose (signup or forgotPassword) are required' });
    }
    // For forgotPassword, user must exist
    const user = await User.findOne({ $or: [{ email: contact }, { phone: contact }] });
    if (purpose === 'forgotPassword' && !user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Check for existing valid OTP
    const existingOtp = await Otp.findOne({ contact, purpose, expiresAt: { $gt: new Date() } });
    if (existingOtp) {
      // Delete the existing valid OTP
      await Otp.deleteOne({ _id: existingOtp._id });
    }
    // Generate new OTP and create new record
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await Otp.create({
      contact,
      contactType: contact.includes('@') ? 'email' : 'phone',
      otp,
      purpose,
      expiresAt,
      user: user ? user._id : null,
    });
    // Send the new OTP
    if (contact.includes('@')) {
      await sendEmail(contact, `${purpose} OTP`, `Your OTP for ${purpose} is: ${otp}`);
    } else {
      sendPhoneOtp(contact, otp);
    }
    res.status(200).json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({ message: 'Error resending OTP', error: error.message });
  }
};