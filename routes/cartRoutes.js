import express from 'express';
import { addItemToCart, removeItemFromCart, getCart } from '../controllers/cartController.js';
import verifyToken from '../middlewares/verifyToken.js';

const RouteTemplate = () => {
  const router = express.Router();

  router.post('/items', verifyToken, addItemToCart);
  router.delete('/items/:productId', verifyToken, removeItemFromCart);
  router.get('/', verifyToken, getCart);

  return router;
};

export default RouteTemplate();