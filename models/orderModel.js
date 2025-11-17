// models/orderModel.js
import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product", 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 1
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  // Per-product payment
  paymentId: { 
    type: String, 
    default: null 
  },
  paymentStatus: { 
    type: String, 
    enum: ["Pending", "Paid", "Failed", "Refunded"], 
    default: "Pending" 
  },
  // Per-product fulfillment
  trackingId: { 
    type: String, 
    default: null 
  },
  orderStatus: { 
    type: String, 
    enum: ["Processing", "Shipped", "Delivered", "Cancelled"], 
    default: "Processing" 
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    orderItems: [orderItemSchema],

    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true
    },
    paymentMethod: { 
      type: String, 
      enum: ["COD", "Card", "UPI", "PayPal", "Razorpay"], 
      required: true 
    },
    paymentDetails: {
      subtotal: { type: Number, required: true, min: 0 },
      tax: { type: Number, required: true, min: 0 },
      shipping: { type: Number, required: true, min: 0 },
      processing: { type: Number, required: true, min: 0 },
      totalPrice: { type: Number, required: true, min: 0 },
    },
    razorpayOrderId: { type: String, default: null },
    razorpayPaymentId: { type: String, default: null }, 
    currency: { type: String, default: "INR" },
  },
  { timestamps: true }
);

orderSchema.index({ shippingAddress: 1 });
orderSchema.index({ "orderItems.trackingId": 1 });
orderSchema.index({ "orderItems.paymentId": 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;