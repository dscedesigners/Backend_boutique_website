import { User } from '../models/userModel.js';
import Otp from '../models/otpModel.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sendEmail } from '../utiles/nodemailer.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Helper function to generate OTP
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Helper function to send OTP to phone (placeholder)
const sendPhoneOtp = (phone, otp) => {
  console.log(`Sending OTP ${otp} to phone ${phone}`); // Placeholder for SMS service
  // Replace with actual SMS service (e.g., Twilio) implementation
};

export const getAllUsers = async (req, res) => {
  try {
    console.log('Get All Users called at', new Date().toLocaleString());
    const { role, page = 1, limit = 10 } = req.query;
    const query = role ? { role } : {};
    if (role && !['user', 'admin', 'vendor'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role parameter' });
    }
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    if (isNaN(parsedPage) || parsedPage < 1 || isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({ message: 'Invalid page or limit parameter' });
    }
    const skip = (parsedPage - 1) * parsedLimit;
    const users = await User.find(query).select('-password').skip(skip).limit(parsedLimit);
    const total = await User.countDocuments(query);
    res.status(200).json({
      message: 'Fetched all users',
      users,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit)
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    console.log('Get User By ID called at', new Date().toLocaleString());
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: can only fetch own details or admin access required' });
    }
    res.status(200).json({ message: `Fetched user with ID: ${req.params.id}`, user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    console.log('Get User Details called at', new Date().toLocaleString());
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'Fetched user details', user });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Error fetching user details', error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    console.log('Update User called at', new Date().toLocaleString());
    const { name, email, phone, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Access denied: can only update own profile' });
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    await user.save();
    res.status(200).json({ message: `User with ID ${req.params.id} updated`, user: user.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } }) });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    console.log('Delete User called at', new Date().toLocaleString());
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Access denied: can only delete own profile' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: `User with ID ${req.params.id} deleted` });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

export const userLogin = async (req, res) => {
  try {
    console.log('User Login called at', new Date().toLocaleString());
    const { contact, password } = req.body;
    if (!contact || !password) {
      return res.status(400).json({ message: 'Contact and password are required' });
    }
    const user = await User.findOne({ $or: [{ email: contact }, { phone: contact }] });
    if (!user || user.role !== 'user') {
      return res.status(401).json({ message: 'Invalid credentials or not a user' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: 'User logged in successfully', token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone } });
  } catch (error) {
    console.error('Error during user login:', error);
    res.status(500).json({ message: 'Error during user login', error: error.message });
  }
};

export const userSignup = async (req, res) => {
  try {
    console.log('User Signup called at', new Date().toLocaleString());
    const { name, email, phone, password, emailOtp, phoneOtp } = req.body;
    if (!name || !email || !phone || !password || !emailOtp || !phoneOtp) {
      return res.status(400).json({ message: 'Name, email, phone, password, email OTP, and phone OTP are required' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or phone already exists' });
    }
    // Verify both email and phone OTPs
    const emailOtpRecord = await Otp.findOne({ contact: email, otp: emailOtp, purpose: 'signup', expiresAt: { $gt: new Date() } });
    const phoneOtpRecord = await Otp.findOne({ contact: phone, otp: phoneOtp, purpose: 'signup', expiresAt: { $gt: new Date() } });
    if (!emailOtpRecord || !phoneOtpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP for email or phone' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, phone, password: hashedPassword, role: 'user' });
    await user.save();
    await Otp.deleteOne({ _id: emailOtpRecord._id });
    await Otp.deleteOne({ _id: phoneOtpRecord._id });
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ message: 'User signed up successfully', token, user: { id: user._id, name, email, phone } });
  } catch (error) {
    console.error('Error during user signup:', error);
    res.status(500).json({ message: 'Error during user signup', error: error.message });
  }
};

export const userForgotPassword = async (req, res) => {
  try {
    console.log('User Forgot Password called at', new Date().toLocaleString());
    const { contact } = req.body;
    if (!contact) {
      return res.status(400).json({ message: 'Email or phone is required' });
    }
    const user = await User.findOne({ $or: [{ email: contact }, { phone: contact }] });
    if (!user || user.role !== 'user') {
      return res.status(404).json({ message: 'User not found' });
    }
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await Otp.create({
      contact,
      contactType: contact.includes('@') ? 'email' : 'phone',
      otp,
      purpose: 'forgotPassword',
      expiresAt,
      user: user._id,
    });
    if (contact.includes('@')) {
      await sendEmail(contact, 'Password Reset OTP', `Your OTP for password reset is: ${otp}`);
    } else {
      sendPhoneOtp(contact, otp);
    }
    res.status(200).json({ message: 'Forgot password OTP sent successfully' });
  } catch (error) {
    console.error('Error during forgot password:', error);
    res.status(500).json({ message: 'Error during forgot password', error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    console.log('Reset Password called at', new Date().toLocaleString());
    const { contact, otp, newPassword } = req.body;
    if (!contact || !otp || !newPassword) {
      return res.status(400).json({ message: 'Contact, OTP, and new password are required' });
    }
    const user = await User.findOne({ $or: [{ email: contact }, { phone: contact }] });
    if (!user || user.role !== 'user') {
      return res.status(404).json({ message: 'User not found' });
    }
    const otpRecord = await Otp.findOne({ contact, otp, purpose: 'forgotPassword', expiresAt: { $gt: new Date() } });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await Otp.deleteOne({ _id: otpRecord._id });
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error during password reset:', error);
    res.status(500).json({ message: 'Error during password reset', error: error.message });
  }
};

export const verifyToken = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; 
    res.status(200).json({ message: 'Token verified successfully', user: req.user });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const adminLogin = async (req, res) => {
  try {
    console.log('Admin Login called at', new Date().toLocaleString());
    const { contact, password } = req.body;
    if (!contact || !password) {
      return res.status(400).json({ message: 'Contact and password are required' });
    }
    const user = await User.findOne({ $or: [{ email: contact }, { phone: contact }] });
    if (!user || user.role !== 'admin') {
      return res.status(401).json({ message: 'Invalid credentials or not an admin' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '48h' });
    res.status(200).json({ message: 'Admin logged in successfully', token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone } });
  } catch (error) {
    console.error('Error during admin login:', error);
    res.status(500).json({ message: 'Error during admin login', error: error.message });
  }
};

export const adminSignup = async (req, res) => {
  try {
    console.log('Admin Signup called at', new Date().toLocaleString());
    const { name, email, phone, password, emailOtp, phoneOtp } = req.body;
    if (!name || !email || !phone || !password || !emailOtp || !phoneOtp) {
      return res.status(400).json({ message: 'Name, email, phone, password, email OTP, and phone OTP are required' });
    }
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can register other admins' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or phone already exists' });
    }
    const emailOtpRecord = await Otp.findOne({ contact: email, otp: emailOtp, purpose: 'signup', expiresAt: { $gt: new Date() } });
    const phoneOtpRecord = await Otp.findOne({ contact: phone, otp: phoneOtp, purpose: 'signup', expiresAt: { $gt: new Date() } });
    if (!emailOtpRecord || !phoneOtpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP for email or phone' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, phone, password: hashedPassword, role: 'admin' });
    await user.save();
    await Otp.deleteOne({ _id: emailOtpRecord._id });
    await Otp.deleteOne({ _id: phoneOtpRecord._id });
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '48h' });
    res.status(201).json({ message: 'Admin signed up successfully', token, user: { id: user._id, name, email, phone } });
  } catch (error) {
    console.error('Error during admin signup:', error);
    res.status(500).json({ message: 'Error during admin signup', error: error.message });
  }
};

export const vendorLogin = async (req, res) => {
  try {
    console.log('Vendor Login called at', new Date().toLocaleString());
    const { contact, password } = req.body;
    if (!contact || !password) {
      return res.status(400).json({ message: 'Contact and password are required' });
    }
    const user = await User.findOne({ $or: [{ email: contact }, { phone: contact }] });
    if (!user || user.role !== 'vendor') {
      return res.status(401).json({ message: 'Invalid credentials or not a vendor' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '48h' });
    res.status(200).json({ message: 'Vendor logged in successfully', token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone } });
  } catch (error) {
    console.error('Error during vendor login:', error);
    res.status(500).json({ message: 'Error during vendor login', error: error.message });
  }
};

export const vendorSignup = async (req, res) => {
  try {
    console.log('Vendor Signup called at', new Date().toLocaleString());
    const { name, email, phone, password, emailOtp, phoneOtp } = req.body;
    if (!name || !email || !phone || !password || !emailOtp || !phoneOtp) {
      return res.status(400).json({ message: 'Name, email, phone, password, email OTP, and phone OTP are required' });
    }
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or phone already exists' });
    }
    const emailOtpRecord = await Otp.findOne({ contact: email, otp: emailOtp, purpose: 'signup', expiresAt: { $gt: new Date() } });
    const phoneOtpRecord = await Otp.findOne({ contact: phone, otp: phoneOtp, purpose: 'signup', expiresAt: { $gt: new Date() } });
    if (!emailOtpRecord || !phoneOtpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP for email or phone' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, phone, password: hashedPassword, role: 'vendor' });
    await user.save();
    await Otp.deleteOne({ _id: emailOtpRecord._id });
    await Otp.deleteOne({ _id: phoneOtpRecord._id });
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '48h' });
    res.status(201).json({ message: 'Vendor signed up successfully', token, user: { id: user._id, name, email, phone } });
  } catch (error) {
    console.error('Error during vendor signup:', error);
    res.status(500).json({ message: 'Error during vendor signup', error: error.message });
  }
};

export const vendorForgotPassword = async (req, res) => {
  try {
    console.log('Vendor Forgot Password called at', new Date().toLocaleString());
    const { contact } = req.body;
    if (!contact) {
      return res.status(400).json({ message: 'Email or phone is required' });
    }
    const user = await User.findOne({ $or: [{ email: contact }, { phone: contact }] });
    if (!user || user.role !== 'vendor') {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await Otp.create({
      contact,
      contactType: contact.includes('@') ? 'email' : 'phone',
      otp,
      purpose: 'forgotPassword',
      expiresAt,
      user: user._id,
    });
    if (contact.includes('@')) {
      await sendEmail(contact, 'Password Reset OTP', `Your OTP for password reset is: ${otp}`);
    } else {
      sendPhoneOtp(contact, otp);
    }
    res.status(200).json({ message: 'Forgot password OTP sent successfully' });
  } catch (error) {
    console.error('Error during vendor forgot password:', error);
    res.status(500).json({ message: 'Error during vendor forgot password', error: error.message });
  }
};

export const vendorResetPassword = async (req, res) => {
  try {
    console.log('Vendor Reset Password called at', new Date().toLocaleString());
    const { contact, otp, newPassword } = req.body;
    if (!contact || !otp || !newPassword) {
      return res.status(400).json({ message: 'Contact, OTP, and new password are required' });
    }
    const user = await User.findOne({ $or: [{ email: contact }, { phone: contact }] });
    if (!user || user.role !== 'vendor') {
      return res.status(404).json({ message: 'Vendor not found' });
    }
    const otpRecord = await Otp.findOne({ contact, otp, purpose: 'forgotPassword', expiresAt: { $gt: new Date() } });
    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await Otp.deleteOne({ _id: otpRecord._id });
    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error during vendor password reset:', error);
    res.status(500).json({ message: 'Error during vendor password reset', error: error.message });
  }
};
export const updateUserProfile = async (req, res) => {
  try {
    console.log('Update User Profile called at', new Date().toLocaleString());
    const { name, email, phone } = req.body;

    if (!name && !email && !phone) {
      return res.status(400).json({ message: 'At least one field (name, email, phone) is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent role change or other fields
    if (name) user.name = name;
    if (email) {
      if (email !== user.email) {
        const existingEmail = await User.findOne({ email, _id: { $ne: user._id } });
        if (existingEmail) {
          return res.status(400).json({ message: 'Email already in use' });
        }
        user.email = email;
      }
    }
    if (phone) {
      if (phone !== user.phone) {
        const existingPhone = await User.findOne({ phone, _id: { $ne: user._id } });
        if (existingPhone) {
          return res.status(400).json({ message: 'Phone already in use' });
        }
        user.phone = phone;
      }
    }

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
};