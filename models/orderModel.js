import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    }, // Reference to the User who placed the order
    orderItems: [
      {
        product: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "Product", 
          required: true 
        },
        quantity: { 
          type: Number, 
          required: true 
        },
        price: { 
          type: Number, 
          required: true 
        },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: { 
      type: String, 
      enum: ["COD", "Card", "UPI", "PayPal"], 
      required: true 
    },
    paymentStatus: { 
      type: String, 
      enum: ["Pending", "Paid"], 
      default: "Pending" 
    },
    orderStatus: { 
      type: String, 
      enum: ["Processing", "Shipped", "Delivered", "Cancelled"], 
      default: "Processing" 
    },
    totalPrice: { 
      type: Number, 
      required: true 
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
