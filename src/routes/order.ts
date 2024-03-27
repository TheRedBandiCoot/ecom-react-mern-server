import express from 'express';
import { adminOnly } from '../middlewares/auth.js';
import {
  myOrder,
  newOrder,
  allOrder,
  getSingleOrder,
  processOrder,
  deleteOrder,
} from '../controllers/order.js';
const app = express.Router();

//@ route - POST - /api/v1/order/new
app.post('/new', newOrder);

//@ route - GET - /api/v1/order/my
app.get('/my', myOrder);

//@ route - GET - /api/v1/order/all
app.get('/all', adminOnly, allOrder);

//@ route - GET - /api/v1/order/:id
app.route('/:id').get(getSingleOrder).put(adminOnly, processOrder).delete(adminOnly, deleteOrder);

export default app;
