import type { Request } from 'express';
import { TryCatch } from '../middlewares/error.js';
import type { NewPaymentRequestBody } from '../types/types.js';
import { Coupon } from '../models/coupon.js';
import ErrorHandler from '../utils/utilityClass.js';
import { stripe } from '../app.js';

export const createPaymentIntent = TryCatch(
  async (req: Request<{}, {}, NewPaymentRequestBody>, res, next) => {
    const { amount } = req.body;

    if (!amount) return next(new ErrorHandler('please Enter $amount', 400));

    const intentPayment = await stripe.paymentIntents.create({
      amount: Number(amount) * 100,
      currency: 'inr'
    });

    return res.status(201).json({
      success: true,
      clientSecret: intentPayment.client_secret
    });
  }
);
export const newCoupon = TryCatch(
  async (req: Request<{}, {}, NewPaymentRequestBody>, res, next) => {
    const { coupon, amount } = req.body;

    if (!coupon || !amount)
      return next(
        new ErrorHandler('please Enter both $coupon and $amount', 400)
      );

    const createCoupon = await Coupon.create({ code: coupon, amount });

    return res.status(201).json({
      success: true,
      message: `Coupon ${coupon} : ${createCoupon._id} Created Successfully`
    });
  }
);

export const applyDiscount = TryCatch(
  async (
    req: Request<{}, {}, {}, Pick<NewPaymentRequestBody, 'coupon'>>,
    res,
    next
  ) => {
    const { coupon } = req.query;

    const discount = await Coupon.findOne({ code: coupon });

    if (!discount) return next(new ErrorHandler(`Coupon Not Found`, 404));

    return res.status(200).json({
      success: true,
      discount: discount.amount
    });
  }
);

export const allCoupons = TryCatch(async (req, res, next) => {
  const coupons = await Coupon.find({});

  return res.status(200).json({
    success: true,
    coupons
  });
});

export const deleteCoupon = TryCatch(
  async (req: Request<{ couponID?: string }>, res, next) => {
    const { couponID } = req.params;

    const coupon = await Coupon.findById(couponID);

    console.log('first', coupon);

    if (!coupon) return next(new ErrorHandler('Invalid Coupon ID', 400));

    console.log('second', coupon);

    await coupon.deleteOne();

    return res.status(200).json({
      success: true,
      message: `Coupon Deleted Successfully`
    });
  }
);
