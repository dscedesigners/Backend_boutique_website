import Product from '../models/productModel.js';
import { cloudinary } from '../utiles/cloudinary.js';
import Category from '../models/categoryModel.js';

export const createProduct = async (req, res) => {
  try {
    // This line now expects 'color' and 'size' to be single strings from the request body.
    const { name, description, price, category, stock, brand, gender, color, size, cloth } = req.body;
    
    // Validate required fields
    if (!name || !description || !price || !category || !stock || !brand || !gender) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Validate category
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Validate user (vendor)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated or invalid token' });
    }

    // Validate thumbnail (exactly one image required)
    if (!req.files || !req.files.thumbnail || (Array.isArray(req.files.thumbnail) && req.files.thumbnail.length !== 1)) {
      return res.status(400).json({ message: 'Exactly one thumbnail image is required' });
    }

    // Handle thumbnail upload
    let thumbnail = '';
    const thumbnailFile = Array.isArray(req.files.thumbnail) ? req.files.thumbnail[0] : req.files.thumbnail;
    thumbnail = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
        if (error) reject(new Error('Thumbnail upload failed'));
        resolve(result.secure_url);
      }).end(thumbnailFile.buffer);
    });

    // Handle other images (optional)
    const otherImages = [];
    if (req.files.images) {
      const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      const uploadPromises = imageFiles.map(file => 
        new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
            if (error) reject(new Error('Image upload failed'));
            resolve(result.secure_url);
          }).end(file.buffer);
        })
      );
      const uploadedImages = await Promise.all(uploadPromises);
      otherImages.push(...uploadedImages);
    }

    // The single string values for color, size, and cloth are passed to the new product document.
    const product = new Product({
      name,
      description,
      price,
      category,
      stock,
      brand,
      thumbnail,
      otherImages,
      gender,
      color,
      size,
      cloth,
      vendor: req.user.id
    });

    await product.save();
    res.status(201).json({ message: 'Product created successfully', data: product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const query = {};
    if (req.query.minPrice) query.price = { ...query.price, $gte: parseFloat(req.query.minPrice) };
    if (req.query.maxPrice) query.price = { ...query.price, $lte: parseFloat(req.query.maxPrice) };
    if (req.query.gender) query.gender = req.query.gender;
    if (req.query.category) query.category = req.query.category;
    if (req.query.rating) query.rating = { $gte: parseFloat(req.query.rating) };
    if (req.query.brands) query.brand = { $in: req.query.brands.split(',') };
    const products = await Product.find(query)
      .select('name price brand thumbnail')
      .skip(skip)
      .limit(limit)
      .lean();
    const total = await Product.countDocuments(query);
    res.status(200).json({
      message: 'Fetched all products',
      data: products,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate('category', 'name')
      .populate('vendor', 'username')
      .lean();
    if (!product) return res.status(404).json({ message: 'Product not found' });
    // This response will now automatically include the single string color, size, and cloth fields.
    res.status(200).json({ message: 'Product fetched successfully', data: product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.category) {
      const categoryExists = await Category.findById(updates.category);
      if (!categoryExists) return res.status(400).json({ message: 'Invalid category' });
    }
    if (req.files && req.files.thumbnail) {
      const thumbnailFile = Array.isArray(req.files.thumbnail) ? req.files.thumbnail[0] : req.files.thumbnail;
      updates.thumbnail = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
          if (error) reject(new Error('Thumbnail upload failed'));
          resolve(result.secure_url);
        }).end(thumbnailFile.buffer);
      });
    }
    if (req.files && req.files.images) {
      const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      const uploadPromises = imageFiles.map(file => 
        new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream({ resource_type: 'image' }, (error, result) => {
            if (error) reject(new Error('Image upload failed'));
            resolve(result.secure_url);
          }).end(file.buffer);
        })
      );
      updates.otherImages = await Promise.all(uploadPromises);
    }
    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ message: 'Product updated successfully', data: product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    if (product.thumbnail) {
      const publicId = product.thumbnail.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(publicId);
    }
    if (product.otherImages && product.otherImages.length > 0) {
      const deletePromises = product.otherImages.map(image => {
        const publicId = image.split('/').pop().split('.')[0];
        return cloudinary.uploader.destroy(publicId);
      });
      await Promise.all(deletePromises);
    }
    await product.deleteOne();
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

export const getAllBrands = async (req, res) => {
  try {
    const brands = await Product.aggregate([
      { $group: { _id: '$brand' } },
      { $project: { _id: 0, brand: '$_id' } },
      { $sort: { brand: 1 } }
    ]).then(results => results.map(result => result.brand));
    res.status(200).json({ message: 'Fetched all brands', data: brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ message: 'Error fetching brands', error: error.message });
  }
};

export const getProductSuggestions = async (req, res) => {
  try {
    const { id: productId } = req.params;

    // 1. Find the original product to get its category ID
    const originalProduct = await Product.findById(productId).select('category').lean();
    if (!originalProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const categoryId = originalProduct.category;

    // 2. Setup pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5; // Default limit of 5 per page
    const skip = (page - 1) * limit;
    
    // 3. Define the query to find similar products
    const query = {
      category: categoryId,
      _id: { $ne: productId } // Exclude the original product from suggestions
    };

    // 4. Fetch the suggested products and the total count for pagination
    const suggestedProducts = await Product.find(query)
      .select('name price brand thumbnail') // Select only the required fields
      .skip(skip)
      .limit(limit)
      .lean();
      
    const total = await Product.countDocuments(query);

    // 5. Send the response in the desired format
    res.status(200).json({
      message: 'Fetched all products',
      data: suggestedProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      categoryId: categoryId,
    });

  } catch (error) {
    console.error('Error fetching product suggestions:', error);
    res.status(500).json({ message: 'Error fetching product suggestions', error: error.message });
  }
};
