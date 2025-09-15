import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  contact: {
    type: String,
    required: true, // Can store either email or phone number
  },
  contactType: {
    type: String,
    enum: ['email', 'phone'],
    required: true, // Specifies whether contact is email or phone
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['login', 'signup', 'forgotPassword', 'other'],
    required: true, // Specifies the purpose of the OTP
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Optional, as OTPs may be sent before user creation (e.g., signup)
  }
}, { timestamps: true });

// Index to improve query performance for OTP lookup by contact and purpose
otpSchema.index({ contact: 1, purpose: 1 });

const Otp = mongoose.model('Otp', otpSchema);

export default Otp;