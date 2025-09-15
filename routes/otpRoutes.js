import express from 'express';
import { createOtp, verifyOtp, resendOtp } from '../controllers/otpController.js';

const RouteTemplate = () => {
  const router = express.Router();

  router.post('/', createOtp);
  router.post('/verify', verifyOtp);
  router.post('/resend', resendOtp);

  return router;
};

export default RouteTemplate();