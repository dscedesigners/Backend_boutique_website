import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  phone: { 
    type: String, 
    required: false, 
    unique: true,
    sparse: true 
  },
  name: { 
    type: String,
    required: true
  },
  email: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  password: { 
    type: String,
    required: true 
  },
  role: {
    type: String,
    enum: ["admin", "vendor", "user"], 
    default: "user",
    required: true
  },
  addresses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Address", 
    required: false
  }],
  image: {
    type: String,
    required: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

export { User };