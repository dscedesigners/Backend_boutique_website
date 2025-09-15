import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Category", 
    required: true 
  },

  stock: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  brand: { 
    type: String, 
    required: true 
  },

  thumbnail: { 
    type: String, 
    required: true 
  },

  otherImages: {
    type: [String],
    default: []
  },

  gender: {
    type: String,
    enum: ["male", "female", "unisex","kids"], 
    required: true
  },
  
color: {
    type: String, // Changed from [String]
    trim: true
  },

  size: {
    type: String,
    trim: true
  },

  cloth: {
    type: String,
    trim: true
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
    required: true
  },
  rating: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 5 
  },
  reviews: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Review' 
  }],
}, { timestamps: true });

// Index to improve query performance
productSchema.index({ category: 1, subcategory: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;