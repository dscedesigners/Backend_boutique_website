import express from 'express';
import { createReview, getAllReviews, getReviewById, updateReview, deleteReview } from '../controllers/reviewController.js';
import verifyTokenMiddleware from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';

const RouteTemplate = () => {
  const router = express.Router();

  router.post('/', verifyTokenMiddleware, createReview);
  router.get('/', getAllReviews);
  router.get('/:id', getReviewById);
  router.put('/:id', verifyTokenMiddleware, updateReview);
  router.delete('/:id', verifyTokenMiddleware, checkRole(['admin']), deleteReview);

  return router;
};

export default RouteTemplate();