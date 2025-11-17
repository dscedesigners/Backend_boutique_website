import express from 'express';
import { 
  createProduct, 
  getAllProducts, 
  getProductById, 
  updateProduct, 
  deleteProduct, 
  getAllBrands,
  getProductSuggestions
} from '../controllers/productController.js';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';
import multer from 'multer';
import optionalAuth from '../middlewares/optionalAuth.js';

const RouteTemplate = () => {
  const router = express.Router();
  const upload = multer({ storage: multer.memoryStorage() });

  // Create product (admin or vendor)
  router.post('/', 
    verifyToken, 
    checkRole(['admin', 'vendor']), 
    upload.fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 4 }
    ]), 
    createProduct
  );
  
  // Get all products (public)
  router.get('/',optionalAuth, getAllProducts);

  router.get('/brands', getAllBrands);
  router.get('/:id/suggestions', getProductSuggestions);
  // Get product by ID (public)
  router.get('/:id', optionalAuth,getProductById);
  
  // Update product (admin or vendor)
  router.put('/:id', 
    verifyToken, 
    checkRole(['admin', 'vendor']), 
    upload.fields([
      { name: 'thumbnail', maxCount: 1 },
      { name: 'images', maxCount: 4 }
    ]), 
    updateProduct
  );
  
  // Delete product (admin or vendor)
  router.delete('/:id', verifyToken, checkRole(['admin', 'vendor']), deleteProduct);

  return router;
};

export default RouteTemplate();