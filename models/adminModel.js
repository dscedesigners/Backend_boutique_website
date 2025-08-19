import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'superadmin'],//for future management of the admins
    default: 'admin'
  },
  permissions: {
    orders: { type: Boolean, default: true },
    products: { type: Boolean, default: true },
    customers: { type: Boolean, default: true },
    analytics: { type: Boolean, default: true }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model("Admin", adminSchema);