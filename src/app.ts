//* Importing Routes
import express from 'express';
import colors from 'colors';
import { connectDB } from './utils/features.js';
import { errorMiddleware } from './middlewares/error.js';
import NodeCache from 'node-cache';
import morgan from 'morgan';
import Stripe from 'stripe';
import cors from 'cors';
// @ts-ignore
import { styleText } from 'node:util';

//@ importing routes
import userRoutes from './routes/user.js';
import productRoute from './routes/product.js';
import orderRoute from './routes/order.js';
import paymentRoute from './routes/payment.js';
import dashboardRoute from './routes/stats.js';

//  import { config } from 'dotenv';
// config({
//  path: './.env',
// });

process.env.PORT == undefined && console.log(`ENV PORT NOT WORKING`.bgRed);

const port = process.env.PORT || 3001;
const mongoURI = process.env.MONGO_URI;
const stripeKey = process.env.STRIPE_KEY;

connectDB(mongoURI);

export const stripe = new Stripe(stripeKey);
export const nodeCache = new NodeCache();

const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(cors());

colors.enable();

app.use('/uploads', express.static('uploads'));

//@ Using Routes
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/product', productRoute);
app.use('/api/v1/order', orderRoute);
app.use('/api/v1/payment', paymentRoute);
app.use('/api/v1/dashboard', dashboardRoute);

app.use(errorMiddleware);

app.listen(port, () =>
  console.log(
    `server is listening at`,
    styleText('bgGreen', `http://localhost:${port}`)
  )
);
