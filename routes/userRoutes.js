import express from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser, userLogin, userSignup, userForgotPassword, verifyToken, adminLogin, vendorLogin, vendorSignup, vendorForgotPassword, resetPassword, vendorResetPassword, adminSignup, getUserDetails, updateUserProfile } from '../controllers/userController.js';
import verifyTokenMiddleware from '../middlewares/verifyToken.js';
import checkRole from '../middlewares/checkRole.js';
import rateLimitMiddleware from '../middlewares/rateLimitMiddleware.js';

const RouteTemplate = () => {
  const router = express.Router();

  router.get('/', rateLimitMiddleware(15 * 60 * 1000, 10), verifyTokenMiddleware, checkRole(['admin']), getAllUsers);
  router.get('/me', rateLimitMiddleware(15 * 60 * 1000, 10), verifyTokenMiddleware, getUserDetails);
  router.put('/profile', rateLimitMiddleware(15 * 60 * 1000, 10), verifyTokenMiddleware, updateUserProfile);
  router.get('/:id', rateLimitMiddleware(15 * 60 * 1000, 10), verifyTokenMiddleware, checkRole(['admin']), getUserById);
  router.put('/:id', rateLimitMiddleware(15 * 60 * 1000, 5), verifyTokenMiddleware, checkRole(['admin']), updateUser);
  router.delete('/:id', rateLimitMiddleware(15 * 60 * 1000, 5), verifyTokenMiddleware, checkRole(['admin']), deleteUser);
  router.post('/login', rateLimitMiddleware(15 * 60 * 1000, 5), userLogin);
  router.post('/signup', rateLimitMiddleware(15 * 60 * 1000, 5), userSignup);
  router.post('/forgot-password', rateLimitMiddleware(15 * 60 * 1000, 3), userForgotPassword);
  router.post('/reset-password', rateLimitMiddleware(15 * 60 * 1000, 3), resetPassword);
  router.post('/verify-token', rateLimitMiddleware(15 * 60 * 1000, 5), verifyToken);
  router.post('/admin/login', rateLimitMiddleware(15 * 60 * 1000, 5), adminLogin);
  router.post('/admin/signup', rateLimitMiddleware(15 * 60 * 1000, 5), verifyTokenMiddleware, checkRole(['admin']), adminSignup);
  router.post('/vendor/login', rateLimitMiddleware(15 * 60 * 1000, 5), vendorLogin);
  router.post('/vendor/signup', rateLimitMiddleware(15 * 60 * 1000, 5), vendorSignup);
  router.post('/vendor/forgot-password', rateLimitMiddleware(15 * 60 * 1000, 3), vendorForgotPassword);
  router.post('/vendor/reset-password', rateLimitMiddleware(15 * 60 * 1000, 3), vendorResetPassword);
  

  return router;
};

export default RouteTemplate();