import type { Request } from 'express';
import { TryCatch } from '../middlewares/error.js';
import type { NewOrderRequestBody, OrderRequestQuery } from '../types/types.js';
import { Order } from '../models/order.js';
import { invalidateCache, reduceStock } from '../utils/features.js';
import ErrorHandler from '../utils/utilityClass.js';
import { nodeCache } from '../app.js';

export const myOrder = TryCatch(
  async (req: Request<{}, {}, {}, OrderRequestQuery<string>>, res, next) => {
    const { id: user } = req.query;

    const key = `my-order-${user}`;
    let orders = [];

    if (nodeCache.has(key)) orders = JSON.parse(nodeCache.get(key) as string);
    else {
      orders = await Order.find({ user });
      nodeCache.set(key, JSON.stringify(orders));
    }

    return res.status(200).json({
      success: true,
      orders
    });
  }
);

export const allOrder = TryCatch(
  async (req: Request<{}, {}, {}, OrderRequestQuery<string>>, res, next) => {
    const key = `all-order`;

    let orders = [];

    if (nodeCache.has(key)) orders = JSON.parse(nodeCache.get(key) as string);
    else {
      orders = await Order.find().populate('user', ['name', 'email']);
      nodeCache.set(key, JSON.stringify(orders));
    }

    return res.status(200).json({
      success: true,
      orders
    });
  }
);

export const getSingleOrder = TryCatch(
  async (req: Request<{ id?: string }>, res, next) => {
    const { id } = req.params;

    const key = `order-${id}`;
    let order;

    if (nodeCache.has(key)) order = JSON.parse(nodeCache.get(key) as string);
    else {
      order = await Order.findById(id).populate('user', ['name', 'email']);

      if (!order) return next(new ErrorHandler('Order Not Found', 404));

      nodeCache.set(key, JSON.stringify(order));
    }

    return res.status(200).json({
      success: true,
      order
    });
  }
);

export const newOrder = TryCatch(
  async (req: Request<{}, {}, NewOrderRequestBody>, res, next) => {
    const {
      shippingInfo,
      orderItems,
      user,
      subTotal,
      tax,
      shippingCharges,
      discount,
      total
    } = req.body;

    if (!shippingInfo || !orderItems || !user || !subTotal || !tax || !total)
      return next(new ErrorHandler('Please Enter All fields', 404));

    const createOrder = await Order.create({
      shippingInfo,
      orderItems,
      user,
      subTotal,
      tax,
      shippingCharges,
      discount,
      total
    });
    await reduceStock(orderItems);
    invalidateCache({
      product: true,
      order: true,
      admin: true,
      userID: user,
      productID: createOrder.orderItems.map(item => String(item.productID))
    });

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully'
      // orderID: createOrder._id
    });
  }
);

export const processOrder = TryCatch(
  async (req: Request<{ id?: string }, {}, NewOrderRequestBody>, res, next) => {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) return next(new ErrorHandler('Order Not Found', 404));
    if (order.status === 'Delivered') {
      return res.status(200).json({
        success: true,
        message: `Order Already Delivered`
      });
    }

    switch (order.status) {
      case 'Processing':
        order.status = 'Shipped';
        break;
      case 'Shipped':
        order.status = 'Delivered';
        break;
      default:
        order.status = 'Delivered';
        break;
    }

    await order.save();

    invalidateCache({
      product: false,
      order: true,
      admin: true,
      userID: order.user,
      orderID: String(order._id)
    });

    return res.status(200).json({
      success: true,
      message: `Order Processed successfully | Status : ${order.status}`
    });
  }
);

export const deleteOrder = TryCatch(
  async (req: Request<{ id?: string }, {}, NewOrderRequestBody>, res, next) => {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) return next(new ErrorHandler('Order Not Found', 404));

    await order.deleteOne();

    invalidateCache({
      product: false,
      order: true,
      admin: true,
      userID: order.user,
      orderID: String(order._id)
    });

    return res.status(200).json({
      success: true,
      message: `Order Deleted successfully`
    });
  }
);
