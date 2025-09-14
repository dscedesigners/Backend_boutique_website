import Product from "../models/tailorModel.js";
import Order from "../models/orderModel.js"; // ADD THIS IMPORT

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, brand, images } = req.body;

    // Validate required fields
    if (!name || !description || !price || !category || !stock || !brand || !images || images.length === 0) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Create a new product
    const newProduct = new Product({
      name,
      description,
      price,
      category,
      stock,
      brand,
      images,
    });

    // Save the product to the database
    await newProduct.save();

    res.status(201).json({ message: 'Product created successfully', product: newProduct });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product', error });
  }
};

const getAllProducts = async(req,res)=>{
  try {
    const products = await Product.find({});
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
}

const getSingleProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Error fetching product", error: error.message });
  }
};

// FIXED: Get top products based on order data
const getTopProducts = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    // First check if there are any orders
    const orderCount = await Order.countDocuments();
    
    if (orderCount === 0) {
      return res.status(200).json({
        success: true,
        products: [],
        total: 0,
        message: "No orders found. Create some orders to see top products."
      });
    }

    // Aggregate orders to find top selling products
    const topProducts = await Order.aggregate([
      // Unwind the orderItems array to work with individual items
      { $unwind: "$orderItems" },
      
      // Group by product and calculate total sales
      {
        $group: {
          _id: "$orderItems.product",
          totalQuantitySold: { $sum: "$orderItems.quantity" },
          totalRevenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } },
          orderCount: { $sum: 1 }
        }
      },
      
      // Sort by total quantity sold (most popular first)
      { $sort: { totalQuantitySold: -1 } },
      
      // Limit results
      { $limit: parseInt(limit) },
      
      // Lookup product details from the correct collection
      {
        $lookup: {
          from: "tailormodels", // MongoDB collection name (usually lowercase + 's')
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      
      // Unwind product details
      { $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true } },
      
      // Project final structure
      {
        $project: {
          _id: 1,
          name: { $ifNull: ["$productDetails.name", "Unknown Product"] },
          brand: { $ifNull: ["$productDetails.brand", "Unknown Brand"] },
          totalQuantitySold: 1,
          totalRevenue: 1,
          orderCount: 1,
          thumbnail: { $ifNull: ["$productDetails.thumbnail", ""] }
        }
      }
    ]);

    // Calculate popularity percentages
    const maxSales = topProducts.length > 0 ? topProducts[0].totalQuantitySold : 1;
    const productsWithPopularity = topProducts.map((product, index) => ({
      ...product,
      rank: index + 1,
      popularity: Math.round((product.totalQuantitySold / maxSales) * 100)
    }));

    res.status(200).json({
      success: true,
      products: productsWithPopularity,
      total: productsWithPopularity.length
    });

  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching top products', 
      error: error.message 
    });
  }
};

const getProductStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const lowStockProducts = await Product.countDocuments({ stock: { $lt: 10 } });
    const outOfStockProducts = await Product.countDocuments({ stock: 0 });
    
    // Get categories count
    const categoriesCount = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $count: "totalCategories" }
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalCategories: categoriesCount[0]?.totalCategories || 0
      }
    });

  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching product stats', 
      error: error.message 
    });
  }
};

export { 
    createProduct,
    getAllProducts,
    getSingleProduct,
    getTopProducts,
    getProductStats
};