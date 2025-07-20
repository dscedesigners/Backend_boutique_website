import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    phone: { 
      type: String, 
      required: true, 
      unique: true 
    },
    name: { 
      type: String 
    },
    email: { 
      type: String, 
      unique: true, 
      sparse: true // Allows multiple null/undefined values in a unique index
    },
    password: { 
      type: String 
    },
    address: [
      {
        fullName: String,
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
      }
    ],
    image:{
        type:String
    },
    createdAt: { type: Date, default: Date.now }
  }, { timestamps: true });
    
const User = mongoose.model('User',userSchema);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cartItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
  },
  { timestamps: true }
);

const Cart = mongoose.model("Cart", cartSchema);


export {
   User,
   Cart,
}
