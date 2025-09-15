import express from 'express';
import { 
  createCategory, 
  getAllCategories, 
  updateCategory, 
  deleteCategory
} from '../controllers/categoryController.js';
import verifyToken from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';

const RouteTemplate = () => {
  const router = express.Router();

  // Create category (admin only)
  router.post('/', verifyToken, checkRole(['admin']), createCategory);
  
  // Get all categories (public)
  router.get('/', getAllCategories);
  
  // Update category (admin only)
  router.put('/:id', verifyToken, checkRole(['admin']), updateCategory);
  
  // Delete category (admin only)
  router.delete('/:id', verifyToken, checkRole(['admin']), deleteCategory);

  return router;
};

export default RouteTemplate();