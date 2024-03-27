import express from 'express';
import { adminOnly } from '../middlewares/auth.js';
import { getDashboardStats, getBarCharts, getLineCharts, getPieCharts } from '../controllers/stats.js';
const app = express.Router();

//@ route - GET - /api/v1/dashboard/stats
app.get('/stats', adminOnly, getDashboardStats);

//@ route - GET - /api/v1/dashboard/pie
app.get('/pie', adminOnly, getPieCharts);

//@ route - GET - /api/v1/dashboard/bar
app.get('/bar', adminOnly, getBarCharts);

//@ route - GET - /api/v1/dashboard/line
app.get('/line', adminOnly, getLineCharts);

export default app;
