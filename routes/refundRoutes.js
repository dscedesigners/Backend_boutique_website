import express from 'express';
import { createRefund, getAllRefunds, getRefundById, updateRefund, deleteRefund } from '../controllers/refundController.js';

const RouteTemplate = () => {
  const router = express.Router();

  router.post('/', createRefund);
  router.get('/', getAllRefunds);
  router.get('/:id', getRefundById);
  router.put('/:id', updateRefund);
  router.delete('/:id', deleteRefund);

  return router;
};

export default RouteTemplate();