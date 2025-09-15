import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true, // References the user or vendor
  },
  fullName: {
    type: String,
    required: true,
  },
  street: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  contactPhone: {
    type: String,
    required: false, // Primary contact phone number, optional
  },
  alternateContactPhone: {
    type: String,
    required: false, // Optional alternate contact number
  },
  email: {
    type: String,
    required: true, // Email for notifications
  },
  isDefault: {
    type: Boolean,
    default: false, // Indicates default address for shipping or vendor use
  },
}, { timestamps: true });

// Index to improve query performance for user addresses
addressSchema.index({ user: 1, isDefault: 1 });

const Address = mongoose.model("Address", addressSchema);

export default Address;