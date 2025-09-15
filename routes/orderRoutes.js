import express from 'express';
import { createOrder, getAllOrders, getOrderById, updateOrder, deleteOrder, updateOrderStatus } from '../controllers/orderController.js';

const RouteTemplate = () => {
  const router = express.Router();

  router.post('/', createOrder);
  router.get('/', getAllOrders);
  router.get('/:id', getOrderById);
  router.put('/:id', updateOrder);
  router.delete('/:id', deleteOrder);
  router.patch('/:id/status', updateOrderStatus);

  return router;
};

export default RouteTemplate();