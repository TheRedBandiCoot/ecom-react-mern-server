import express from 'express';
import { adminOnly } from '../middlewares/auth.js';
import {
  allCoupons,
  applyDiscount,
  createPaymentIntent,
  deleteCoupon,
  newCoupon
} from '../controllers/payment.js';
const app = express.Router();

//@ route - GET - /api/v1/payment/create
app.post('/create', createPaymentIntent);

//@ route - GET - /api/v1/payment/discount
app.get('/discount', applyDiscount);

//@ route - POST - /api/v1/payment/coupon/new
app.post('/coupon/new', adminOnly, newCoupon);

//@ route - GET - /api/v1/payment/coupon/all
app.get('/coupon/all', adminOnly, allCoupons);

//@ route - DELETE - /api/v1/payment/coupon/:id
app.delete('/coupon/:couponID', adminOnly, deleteCoupon);

export default app;
