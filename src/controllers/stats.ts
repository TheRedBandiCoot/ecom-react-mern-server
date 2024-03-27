import { nodeCache } from '../app.js';
import { TryCatch } from '../middlewares/error.js';
import { Order } from '../models/order.js';
import { Product } from '../models/product.js';
import { User } from '../models/user.js';
import {
  calculatePercentage,
  getChartDate,
  getInventory
} from '../utils/features.js';

export const getDashboardStats = TryCatch(async (req, res, next) => {
  let stats = {};

  const key = 'admin-stats';
  if (nodeCache.has(key)) stats = JSON.parse(nodeCache.get(key) as string);
  else {
    const today = new Date();
    const sixMonthAgo = new Date();
    sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);

    const thisMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1), //$ First Day Of the current Month
      end: today //$ Last Day (considered as today) of the Month
    };

    const lastMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1), //$ First Day Of the last Month
      end: new Date(today.getFullYear(), today.getMonth(), 0) //$ Last Day of last Month
    };

    const thisMonthProductsPromise = Product.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end
      }
    });
    const lastMonthProductsPromise = Product.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end
      }
    });
    const thisMonthUsersPromise = User.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end
      }
    });
    const lastMonthUsersPromise = User.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end
      }
    });
    const thisMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end
      }
    });
    const lastMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end
      }
    });
    const lastSixMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: sixMonthAgo,
        $lte: today
      }
    });
    const latestTransactionsPromise = Order.find({})
      .select(['orderItems', 'discount', 'total', 'status'])
      .limit(4);

    const [
      thisMonthProducts,
      lastMonthProducts,
      thisMonthUsers,
      lastMonthUsers,
      thisMonthOrders,
      lastMonthOrders,
      lastSixMonthOrders,
      productCount,
      userCount,
      allOrders,
      categories,
      femaleUsersCount,
      latestTransactions
    ] = await Promise.all([
      thisMonthProductsPromise,
      lastMonthProductsPromise,
      thisMonthUsersPromise,
      lastMonthUsersPromise,
      thisMonthOrdersPromise,
      lastMonthOrdersPromise,
      lastSixMonthOrdersPromise,
      Product.countDocuments(),
      User.countDocuments(),
      Order.find({}).select('total'),
      Product.distinct('category'),
      User.countDocuments({ gender: 'female' }),
      latestTransactionsPromise
    ]);

    const thisMonthRevenue = thisMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );
    const lastMonthRevenue = lastMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const changePercent = {
      revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
      product: calculatePercentage(
        thisMonthProducts.length,
        lastMonthProducts.length
      ),
      user: calculatePercentage(thisMonthUsers.length, lastMonthUsers.length),
      order: calculatePercentage(thisMonthOrders.length, lastMonthOrders.length)
    };

    const revenue = allOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const count = {
      revenue,
      user: userCount,
      product: productCount,
      order: allOrders.length
    };
    const orderMonthCounts = new Array(6).fill(0);
    const orderMonthlyRevenue = new Array(6).fill(0);

    lastSixMonthOrders.forEach(order => {
      const creationDate = order.createdAt;
      const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
      if (monthDiff < 6) {
        orderMonthCounts[6 - monthDiff - 1] += 1;
        orderMonthlyRevenue[6 - monthDiff - 1] += order.total;
      }
    });

    const categoryCount = await getInventory({ categories, productCount });

    const userGenderRatio = {
      male: userCount - femaleUsersCount,
      female: femaleUsersCount
    };

    const modifiedLatestTransaction = latestTransactions.map(i => ({
      _id: i._id,
      discount: i.discount,
      amount: i.total,
      quantity: i.orderItems.length,
      status: i.status
    }));

    stats = {
      categoryCount,
      userGenderRatio,
      changePercent,
      latestTransaction: modifiedLatestTransaction,
      count,
      chart: {
        order: orderMonthCounts,
        revenue: orderMonthlyRevenue
      }
    };
    nodeCache.set(key, JSON.stringify(stats));
  }

  return res.status(200).json({
    success: true,
    stats
  });
});
export const getPieCharts = TryCatch(async (req, res, next) => {
  let charts = {};
  const key = 'admin-pie-charts';
  if (nodeCache.has(key)) charts = JSON.parse(nodeCache.get(key) as string);
  else {
    const allOrderPromise = Order.find({}).select([
      'total',
      'subTotal',
      'discount',
      'tax',
      'shippingCharges'
    ]);

    const [
      processingOrder,
      shippedOrder,
      deliveredOrder,
      categories,
      productCount,
      outOfStock,
      allOrders,
      allUsers,
      adminUsersCount,
      customerUsersCount
    ] = await Promise.all([
      Order.countDocuments({ status: 'Processing' }),
      Order.countDocuments({ status: 'Shipped' }),
      Order.countDocuments({ status: 'Delivered' }),
      Product.distinct('category'),
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      allOrderPromise,
      User.find({}).select(['dob']),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'user' })
    ]);

    const orderFullfillment = {
      processing: processingOrder,
      shipped: shippedOrder,
      delivered: deliveredOrder
    };

    const productCategories = await getInventory({ categories, productCount });

    const stockAvailability = {
      inStock: productCount - outOfStock,
      outOfStock
    };

    const grossIncome = allOrders.reduce(
      (prev, order) => prev + (order.total || 0),
      0
    );
    const discount = allOrders.reduce(
      (prev, order) => prev + (order.discount || 0),
      0
    );
    const productionCost = allOrders.reduce(
      (prev, order) => prev + (order.shippingCharges || 0),
      0
    );
    const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0);
    const marketingCost = Math.round(grossIncome * (30 / 100));
    const netMargin =
      grossIncome - discount - productionCost - burnt - marketingCost;

    const revenueDistribution = {
      netMargin,
      discount,
      productionCost,
      burnt,
      marketingCost
    };

    const adminCustomer = {
      admin: adminUsersCount,
      customer: customerUsersCount
    };

    const usersAgeGroup = {
      teen: allUsers.filter(user => user.age < 20).length,
      adult: allUsers.filter(user => user.age >= 20 && user.age < 40).length,
      old: allUsers.filter(user => user.age >= 40).length
    };

    charts = {
      productCategories,
      orderFullfillment,
      stockAvailability,
      revenueDistribution,
      usersAgeGroup,
      adminCustomer
    };

    nodeCache.set(key, JSON.stringify(charts));
  }
  return res.status(200).json({
    success: true,
    charts
  });
});

export const getBarCharts = TryCatch(async (req, res, next) => {
  let charts;
  const key = 'admin-bar-charts';
  if (nodeCache.has(key)) charts = JSON.parse(nodeCache.get(key) as string);
  else {
    const today = new Date();
    const sixMonthAgo = new Date();
    sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);

    const twelveMonthAgo = new Date();
    twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12);

    const sixMonthProductPromise = Product.find({
      createdAt: {
        $gte: sixMonthAgo,
        $lte: today
      }
    }).select('createdAt');
    const sixMonthUsersPromise = User.find({
      createdAt: {
        $gte: sixMonthAgo,
        $lte: today
      }
    }).select('createdAt');

    const twelveMonthOrderPromise = Order.find({
      createdAt: {
        $gte: twelveMonthAgo,
        $lte: today
      }
    }).select('createdAt');

    const [products, users, orders] = await Promise.all([
      sixMonthProductPromise,
      sixMonthUsersPromise,
      twelveMonthOrderPromise
    ]);

    const productCount = getChartDate({ length: 6, today, docArr: products });
    const usersCount = getChartDate({ length: 6, today, docArr: users });
    const ordersCount = getChartDate({ length: 12, today, docArr: orders });

    charts = {
      products: productCount,
      users: usersCount,
      orders: ordersCount
    };
    nodeCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({
    success: true,
    charts
  });
});
export const getLineCharts = TryCatch(async (req, res, next) => {
  let charts;
  const key = 'admin-line-charts';
  if (nodeCache.has(key)) charts = JSON.parse(nodeCache.get(key) as string);
  else {
    const today = new Date();

    const twelveMonthAgo = new Date();
    twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12);

    const baseQuery = {
      createdAt: {
        $gte: twelveMonthAgo,
        $lte: today
      }
    };

    const [products, users, orders] = await Promise.all([
      Product.find(baseQuery).select('createdAt'),
      User.find(baseQuery).select('createdAt'),
      Order.find(baseQuery).select(['createdAt', 'discount', 'total'])
    ]);

    const productCount = getChartDate({ length: 12, today, docArr: products });
    const usersCount = getChartDate({ length: 12, today, docArr: users });
    const revenue = getChartDate({
      length: 12,
      today,
      docArr: orders,
      property: 'total'
    });
    const discount = getChartDate({
      length: 12,
      today,
      docArr: orders,
      property: 'discount'
    });

    charts = {
      products: productCount,
      users: usersCount,
      revenue,
      discount
    };
    nodeCache.set(key, JSON.stringify(charts));
  }

  return res.status(200).json({
    success: true,
    charts
  });
});
