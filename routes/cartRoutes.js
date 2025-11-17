import express from 'express';
import { addItemToCart, removeItemFromCart, getCart ,getCartLength} from '../controllers/cartController.js';
import verifyToken from '../middlewares/verifyToken.js';

const RouteTemplate = () => {
  const router = express.Router();

  router.post('/items', verifyToken, addItemToCart);
  router.delete('/items/:productId', verifyToken, removeItemFromCart);
  router.get('/', verifyToken, getCart);
  router.get('/length', verifyToken, getCartLength);

  return router;
};

export default RouteTemplate();