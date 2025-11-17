import express from 'express';
import { createOrder, getAllOrders, getOrderById, updateOrder, deleteOrder, updateOrderStatus } from '../controllers/orderController.js';
import verifyToken from '../middlewares/verifyToken.js';

const RouteTemplate = () => {
  const router = express.Router();

  router.post('/',verifyToken, createOrder);
  router.get('/', verifyToken,getAllOrders);
  router.get('/:orderId',verifyToken, getOrderById);
  router.put('/:id', verifyToken,updateOrder);
  router.delete('/:id',verifyToken, deleteOrder);
  router.patch('/:id/status',verifyToken, updateOrderStatus);

  return router;
};

export default RouteTemplate();