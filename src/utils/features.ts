import mongoose from 'mongoose';
import fs from 'fs';
import type { OrderItemType, invalidateCacheType } from '../types/types';
import { nodeCache } from '../app.js';
import { Product } from '../models/product.js';
import { faker } from '@faker-js/faker';
import { v2 as cloudinary } from 'cloudinary';

export const connectDB = (uri: string) => {
  mongoose
    .connect(uri, {
      dbName: 'Ecommerce_2024'
    })
    .then(res => console.log(`DB connected to ${res.connection.host}`))
    .catch(err => console.log(err));
};

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

type UploadOnCloudinaryType = {
  localFilePath?: string;
  isUpdateAndDelete?: boolean;
  isDelete?: boolean;
  url?: string;
};

export const uploadOnCloudinary = async ({
  localFilePath,
  isDelete = false,
  isUpdateAndDelete = false,
  url
}: UploadOnCloudinaryType) => {
  const newUrl = url?.split('.')[2].split('/').at(-1)!;
  try {
    if (isDelete) {
      await cloudinary.uploader.destroy(newUrl);
      return null;
    }
    if (!localFilePath) return null;
    if (isUpdateAndDelete) {
      await cloudinary.uploader.destroy(newUrl);
    }
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto'
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath!);
    return null;
  }
};

export const invalidateCache = ({
  product,
  admin,
  order,
  userID,
  orderID,
  productID
}: invalidateCacheType) => {
  if (product) {
    const productKeys: Array<string> = [
      'latest-products',
      'categories',
      'admin-products'
    ];
    if (typeof productID === 'string') productKeys.push(`product-${productID}`);

    if (typeof productID === 'object')
      productID.forEach(item => productKeys.push(`product-${item}`));

    nodeCache.del(productKeys);
  }
  if (order) {
    const orderKeys: Array<string> = [
      `all-order`,
      `my-order-${userID}`,
      `order-${orderID}`
    ];

    nodeCache.del(orderKeys);
  }
  if (admin) {
    nodeCache.del([
      'admin-stats',
      'admin-pie-charts',
      'admin-bar-charts',
      'admin-line-charts'
    ]);
  }
};

export const reduceStock = async (orderItems: Array<OrderItemType>) => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];
    const product = await Product.findById(order.productID);
    if (!product) throw new Error('Product Not Found');
    product.stock -= order.quantity;
    await product.save();
  }
};

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) return thisMonth * 100;

  const percent = (thisMonth / lastMonth) * 100;
  return Number(percent.toFixed(0));
};

export const getInventory = async ({
  categories,
  productCount
}: {
  categories: string[];
  productCount: number;
}) => {
  const categoriesCountPromise = categories.map(category =>
    Product.countDocuments({ category })
  );

  const categoriesCount = await Promise.all(categoriesCountPromise);

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productCount) * 100)
    });
  });

  return categoryCount;
};

type GetChartDateType = {
  length: number;
  today: Date;
  docArr: Array<
    mongoose.Document & { createdAt: Date; discount?: number; total?: number }
  >;
  property?: 'discount' | 'total';
};

export const getChartDate = ({
  length,
  today,
  docArr,
  property
}: GetChartDateType) => {
  const data: Array<number> = new Array(length).fill(0);

  docArr.forEach(i => {
    const creationDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
    if (monthDiff < 6) {
      data[length - monthDiff - 1] += property ? i[property]! : 1;
    }
  });
  return data;
};

const generateRandomProducts = async (count: number = 10) => {
  try {
    const products = [];

    for (let i = 0; i < count; i++) {
      const product = {
        name: faker.commerce.productName(),
        photo: 'uploads\\365c769f-977a-4cd4-afaf-c163ea4872f2.jpg',
        price: faker.commerce.price({ min: 1500, max: 80000, dec: 0 }),
        stock: faker.commerce.price({ min: 0, max: 100, dec: 0 }),
        category: faker.commerce.department(),
        createdAt: new Date(faker.date.past()),
        updatedAt: new Date(faker.date.recent()),
        __v: 0
      };

      products.push(product);
    }

    await Product.create(products);

    console.log({ success: true });
  } catch (error) {
    console.error({ success: false, error });
  }
};

// generateRandomProducts(40);

const deleteRandomProducts = async () => {
  try {
    const products = await Product.find({}).skip(2);
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      await product.deleteOne();
    }

    console.log({ success: true });
  } catch (error) {
    console.log({ success: false, error });
  }
};

// deleteRandomProducts();
