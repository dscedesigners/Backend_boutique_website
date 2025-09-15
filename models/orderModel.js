import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address", // Reference to the Address model for shipping
      required: true
    },
    paymentMethod: { 
      type: String, 
      enum: ["COD", "Card", "UPI", "PayPal", "Razorpay"], 
      required: true 
    },
    paymentStatus: { 
      type: String, 
      enum: ["Pending", "Paid", "Failed", "Refunded"], 
      default: "Pending" 
    },
    orderStatus: { 
      type: String, 
      enum: ["Processing", "Shipped", "Delivered", "Cancelled"], 
      default: "Processing" 
    },
    paymentDetails: {
      subtotal: {
        type: Number,
        required: true, // Base price of all items (sum of quantity * price)
        min: 0
      },
      tax: {
        type: Number,
        required: true, // Tax amount applied to the order
        min: 0
      },
      shipping: {
        type: Number,
        required: true, // Shipping cost for the order
        min: 0
      },
      processing: {
        type: Number,
        required: true, // Processing fees (e.g., payment gateway fees)
        min: 0
      },
      totalPrice: { 
        type: Number, 
        required: true, // Total price including subtotal, tax, shipping, and processing
        min: 0
      },
    },
    razorpayOrderId: { 
      type: String, 
      default: null 
    },
    razorpayPaymentId: { 
      type: String, 
      default: null 
    },
    currency: { 
      type: String, 
      default: "INR" 
    },
  },
  { timestamps: true }
);

// Index to improve query performance for shipping address lookups
orderSchema.index({ shippingAddress: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;