import type { Request, Response, NextFunction } from 'express';
import { TryCatch } from '../middlewares/error.js';
import type {
  BaseQueryType,
  NewProductRequestBody,
  SearchRequestQuery
} from '../types/types.js';
import { Product } from '../models/product.js';
import ErrorHandler from '../utils/utilityClass.js';
import fs from 'fs';
import { nodeCache } from '../app.js';
import { invalidateCache } from '../utils/features.js';

export const getLatestProducts = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let products;

    if (nodeCache.has('latest-products'))
      products = JSON.parse(nodeCache.get('latest-products') as string);
    else {
      products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
      nodeCache.set('latest-products', JSON.stringify(products));
    }

    return res.status(200).json({
      success: true,
      products
    });
  }
);
export const getAllCategories = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let categories;

    if (nodeCache.has('categories'))
      categories = JSON.parse(nodeCache.get('categories') as string);
    else {
      categories = await Product.distinct('category');
      nodeCache.set('categories', JSON.stringify(categories));
    }

    return res.status(200).json({
      success: true,
      categories
    });
  }
);

export const getAdminProducts = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    let products;

    if (nodeCache.has('admin-products'))
      products = JSON.parse(nodeCache.get('admin-products') as string);
    else {
      products = await Product.find({});
      nodeCache.set('admin-products', JSON.stringify(products));
    }
    return res.status(200).json({
      success: true,
      products
    });
  }
);

export const getSingleProduct = TryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    let product;

    if (nodeCache.has(`product-${id}`))
      product = JSON.parse(nodeCache.get(`product-${id}`) as string);
    else {
      product = await Product.findById(id);
      if (!product)
        return next(new ErrorHandler('Product Not found, Invalid ID', 404));
      nodeCache.set(`product-${id}`, JSON.stringify(product));
    }

    return res.status(200).json({
      success: true,
      product
    });
  }
);

export const newProduct = TryCatch(
  async (
    req: Request<{}, {}, NewProductRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, category, price, stock } = req.body;

    const photo = req.file;
    if (!photo) return next(new ErrorHandler('Please Add Photo', 400));

    if (!name || !category || !price || !stock) {
      fs.rm(photo.path, () =>
        console.log('Photo Deleted because rest fields are empty')
      );
      return next(new ErrorHandler('Please Enter All Field', 400));
    }

    await Product.create({
      name,
      price,
      stock,
      category: category.toLowerCase(),
      photo: photo.path
    });

    invalidateCache({ product: true, admin: true });

    return res.status(200).json({
      success: true,
      message: 'Product created successfully'
    });
  }
);

export const updateProduct = TryCatch(
  async (
    req: Request<
      { id?: string },
      {},
      { name: string; category: string; price: number; stock: number }
    >,
    res,
    next
  ) => {
    const { name, category, price, stock } = req.body;
    const { id } = req.params;
    const photo = req.file;
    const product = await Product.findById(id);

    if (!product)
      return next(new ErrorHandler('No such product found, Invalid ID', 404));

    if (photo) {
      fs.rm(product.photo!, () => {
        console.log('Old Photo Deleted');
      });
      product.photo = photo.path;
    }

    if (name) product.name = name;
    if (price) product.price = price;
    if (stock) product.stock = product.stock + Number(stock);
    if (category) product.category = category;

    await product.save();

    invalidateCache({
      product: true,
      admin: true,
      productID: String(product._id)
    });

    return res.status(200).json({
      success: true,
      message: 'Product Updated successfully'
    });
  }
);

export const deleteProduct = TryCatch(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  if (!product) return next(new ErrorHandler('Product Not found', 404));

  fs.rm(product.photo!, () => {
    console.log('Product Photo deleted successfully');
  });

  await product.deleteOne();

  invalidateCache({
    product: true,
    admin: true,
    productID: String(product._id)
  });

  return res.status(200).json({
    success: true,
    message: 'Product Deleted Successfully'
  });
});

export const getAllProducts = TryCatch(
  async (
    req: Request<{}, {}, {}, SearchRequestQuery<string>>,
    res: Response,
    next: NextFunction
  ) => {
    const { search, sort, price, category } = req.query;

    const page = Number(req.query.page) || 1;

    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = (page - 1) * limit;

    const baseQuery: BaseQueryType = {};

    if (search)
      baseQuery.name = {
        $regex: search,
        $options: 'i'
      };

    if (price)
      baseQuery.price = {
        $lte: Number(price)
      };

    if (category) baseQuery.category = category;

    const productPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === 'asc' ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [products, filteredProducts] = await Promise.all([
      productPromise,
      Product.find(baseQuery)
    ]);

    const totalPage = Math.ceil(filteredProducts.length / limit);

    return res.status(200).json({
      success: true,
      products,
      totalPage
    });
  }
);
