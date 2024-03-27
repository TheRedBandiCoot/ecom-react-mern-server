import type { NextFunction, Request, Response } from 'express';
import { User } from '../models/user.js';
import type { NewUserRequestBody } from '../types/types.js';
import ErrorHandler from '../utils/utilityClass.js';
import { TryCatch } from '../middlewares/error.js';
import admin from '../firebaseAdmin.js';

export const newUser = TryCatch(
  async (
    req: Request<{}, {}, NewUserRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    // return next(new ErrorHandler('Error Found', 400));
    // throw new ErrorHandler('new Error found', 402);

    const { name, email, photo, _id, dob, gender } = req.body;

    let user = await User.findById(_id);

    if (user) {
      return res.status(200).json({
        success: true,
        message: `Welcome back, ${user.name}`
      });
    }

    if (!_id || !name || !email || !photo || !gender || !dob)
      return next(new ErrorHandler('Please enter All fields', 400));

    user = await User.create({ name, email, photo, _id, dob, gender });

    return res.status(201).json({
      success: true,
      message: `Welcome, ${user.name}`
    });
  }
);

export const getAllUsers = TryCatch(async (req, res, next) => {
  const users = await User.find({});
  // console.log('testing middleware 102');
  return res.status(200).json({
    success: true,
    users
  });
});

export const getUser = TryCatch(async (req, res, next) => {
  const reqID = req.params.id;
  const user = await User.findById(reqID);
  if (!user)
    return next(
      new ErrorHandler(`No such user found (USER_ID): '${reqID}'`, 404)
    );

  return res.status(200).json({
    success: true,
    user
  });
});

export const deleteUser = TryCatch(async (req, res, next) => {
  const reqID = req.params.id;
  const user = await User.findById(reqID);
  if (!user) return next(new ErrorHandler('No such user found', 404));

  await admin.auth().deleteUser(reqID);
  console.log('successfully deleted user');

  await user.deleteOne();

  return res.status(200).json({
    success: true,
    message: `Delete user: ${reqID} successfully`
  });
});
