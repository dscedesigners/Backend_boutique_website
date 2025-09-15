import express from 'express';
import { createCart, getCart, updateCart, deleteCart, addItemToCart, removeItemFromCart } from '../controllers/cartController.js';

const RouteTemplate = () => {
  const router = express.Router();

  router.post('/', createCart);
  router.get('/:id', getCart);
  router.put('/:id', updateCart);
  router.delete('/:id', deleteCart);
  router.post('/:id/items', addItemToCart);
  router.delete('/:id/items/:itemId', removeItemFromCart);

  return router;
};

export default RouteTemplate();