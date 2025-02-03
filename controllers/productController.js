import Product from "../models/tailorModel.js";

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
     // Fetch all products from DB
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
}
const getSingleProduct = async (req, res) => {
  try {
    const { productId } = req.params; // Get product ID from request parameters

    // Fetch product by ID from the database
    const product = await Product.findById(productId);

    // If product is not found, return a 404 response
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Send the found product as JSON response
    res.status(200).json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ message: "Error fetching product", error: error.message });
  }
};



export { 
    createProduct,
    getAllProducts,
    getSingleProduct
};
