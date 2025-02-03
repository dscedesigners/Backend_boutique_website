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
    type: String, 
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
  images: [{ 
    type: String, 
    required: true 
  }], // Array of image URLs
  rating: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 5 
  }, // Average rating
  reviews: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Review' 
  }],
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);

export default Product