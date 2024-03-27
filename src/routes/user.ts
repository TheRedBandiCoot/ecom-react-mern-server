import express from 'express';
import { deleteUser, getAllUsers, getUser, newUser } from '../controllers/user.js';
import { adminOnly } from '../middlewares/auth.js';
const app = express.Router();

//@ route - GET - /api/v1/user/all
app.get('/all', adminOnly, getAllUsers);

//@ route - GET - /api/v1/user/:id
//@ route - Delete - /api/v1/user/:id
app.route('/:id').get(getUser).delete(adminOnly, deleteUser);

//@ route - POST - /api/v1/user/new
app.post('/new', newUser);

export default app;
