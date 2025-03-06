// controllers/authController.js
import {User,Cart} from '../models/userModel.js' // MongoDB User Model

// Sign Up User
const CreateNewUser = async (req, res) => {
  try {
    let { phone } = req.body;

    // Validate phone input
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    // Check if the phone number already exists in the database
    phone = `+91${phone}`
    let user = await User.findOne({ phone });
    
    if (!user) {
      // If user doesn't exist, create a new user
      user = new User({ phone });
      await user.save();
    }
    
    res.status(200).json({ message: 'User logged in successfully', user: { id: user._id, phone: user.phone } });
  } catch (error) {
    console.error('Error handling user login:', error);
    res.status(500).json({ message: 'Error handling user login', error });
  }
};
 
const UpdateUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    let { name, email, address, removeAddress } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update basic user details
    if (name) user.name = name;
    if (email) user.email = email;

    // Handle profile image upload
    if (req.file) {
      user.image = req.file.path; // Cloudinary auto-generates URL
    }

    // If "address" is provided, add it to existing addresses (instead of replacing)
    if (address) {
      try {
        const parsedAddress = JSON.parse(address);
        if (Array.isArray(parsedAddress)) {
          user.address.push(...parsedAddress);
        } else {
          return res.status(400).json({ message: 'address must be an array' });
        }
      } catch (error) {
        return res.status(400).json({ message: 'Invalid JSON format in address' });
      }
    }

    // Remove a single address by ID if "removeAddress" is provided
    if (removeAddress) {      
      const addressId = removeAddress.trim(); // Ensure it's a string
      user.address = user.address.filter(addr => addr._id.toString() !== addressId);
    }

    await user.save();
    res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile', error });
  }
};


const addToCart = async (req, res) => {
  try {
    const { user, cartItems } = req.body;

    // Validate input
    if (!user || !cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "User ID and cart items are required" });
    }  
    // Find the user's cart
    let cart = await Cart.findOne({ user });

    if (cart) {
      // Update existing cart
      cartItems.forEach((item) => {
        const existingItemIndex = cart.cartItems.findIndex(
          (cartItem) => cartItem.product.toString() === item.product
        );

        if (existingItemIndex >= 0) {
          // If product already exists in the cart, update the quantity
          cart.cartItems[existingItemIndex].quantity += item.quantity;
        } else {
          // Add new product to the cart
          cart.cartItems.push(item);
        }
      });

      // Save the updated cart
      cart = await cart.save();
    } else {
      // Create a new cart if none exists
      cart = new Cart({
        user,
        cartItems,
      });

      await cart.save();
    }

    res.status(201).json({ message: "Cart updated successfully", cart });
  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Error updating cart", error: error.message });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const { user, product } = req.body;

    // Validate input
    if (!user || !product) {
      return res.status(400).json({ message: "User ID and Product ID are required" });
    }

    // Find the user's cart
    const cart = await Cart.findOne({ user });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find the index of the product in the cart
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === product
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in the cart" });
    }

    // Remove the product from the cart
    cart.cartItems.splice(productIndex, 1);

    // Save the updated cart
    await cart.save();

    res.status(200).json({ message: "Product removed from cart", cart });
  } catch (error) {
    console.error("Error removing product from cart:", error);
    res.status(500).json({ message: "Error removing product from cart", error: error.message });
  }
};

const removeOneFromCart = async (req, res) => {
  try {
    const { user, product } = req.body;

    if (!user || !product) {
      return res.status(400).json({ message: "User ID and Product ID are required" });
    }

    // Find the user's cart
    const cart = await Cart.findOne({ user });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Find the product in the cart
    const productIndex = cart.cartItems.findIndex(
      (item) => item.product.toString() === product
    );

    if (productIndex === -1) {
      return res.status(404).json({ message: "Product not found in the cart" });
    }

    // Check the quantity and remove accordingly
    if (cart.cartItems[productIndex].quantity > 1) {
      cart.cartItems[productIndex].quantity -= 1; // Reduce quantity by 1
    } else {
      cart.cartItems.splice(productIndex, 1); // Remove product completely
    }

    // Save the updated cart
    await cart.save();

    res.status(200).json({ message: "Product updated in cart", cart });
  } catch (error) {
    console.error("Error removing product from cart:", error);
    res.status(500).json({ message: "Error removing product from cart", error: error.message });
  }
};


const getUser = async(req,res)=>{
  try {
    const userId = req.params.userId
    console.log(userId);
    
    if (!userId) {
      return res.status(500).json({message : "User ID is required"})
    }
    const user = await User.findOne({phone:userId})
    console.log(user);
    
    return res.status(200).json(user)

  } catch (error) {
    console.error("Error finding user:", error);
    res.status(500).json({ message: "Error finding user", error: error.message });
  }
}
const userCartItems = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    // Find the cart for the given user
    const cart = await Cart.findOne({ user: userId }).populate("cartItems.product"); 

    if (!cart) {
      return res.status(404).json({ message: "Cart not found for this user" });
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error("Error finding cart items:", error);
    res.status(500).json({ message: "Error finding cart items", error: error.message });
  }
};


export  { 
    CreateNewUser, 
    UpdateUserProfile, 
    addToCart,
    removeOneFromCart,
    getUser,
    userCartItems,
    removeFromCart,
};
