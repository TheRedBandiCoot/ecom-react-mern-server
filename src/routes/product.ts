import express from 'express';
import { adminOnly } from '../middlewares/auth.js';
import {
  deleteProduct,
  getAdminProducts,
  getAllCategories,
  getAllProducts,
  getLatestProducts,
  getSingleProduct,
  newProduct,
  updateProduct
} from '../controllers/product.js';
import { upload } from '../middlewares/multer.js';

const app = express.Router();

//@ To Create New Product - route - POST - /api/v1/product/new
app.post('/new', adminOnly, upload, newProduct);

//@ To Get All Products With filters - route - GET - /api/v1/product/search
app.get('/all', getAllProducts);

//@ To Get Latest 5 Products - route - GET - /api/v1/product/latest
app.get('/latest', getLatestProducts);

//@ To Get All Unique Categories - route - GET - /api/v1/product/categories
app.get('/categories', getAllCategories);

//@ To Get All Products - route - GET - /api/v1/product/admin-products
app.get('/admin-products', adminOnly, getAdminProducts);

//@ To Get A Single Product - route - GET - /api/v1/product/:id
//@ To Update A Single Product - route - PUT - /api/v1/product/:id
//@ To Delete A Single Product - route - DELETE - /api/v1/product/:id
app
  .route('/:id')
  .get(getSingleProduct)
  .put(adminOnly, upload, updateProduct)
  .delete(adminOnly, deleteProduct);

export default app;
