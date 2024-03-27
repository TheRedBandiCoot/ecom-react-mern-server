import type { NextFunction, Request, Response } from 'express';
import ErrorHandler from '../utils/utilityClass.js';
import type { ControllerType } from '../types/types.js';

export const errorMiddleware = (
  err: ErrorHandler,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.message ||= 'Internal Server Error'; //@ err.message = err.message || "Internal Server Error";
  err.statusCode ||= 500;
  if (err.name === 'CastError') err.message = 'Invalid ID';
  return res.status(400).json({
    success: false,
    message: err.message
    // statusCode: err.statusCode,
  });
};

export const TryCatch =
  (func: ControllerType) =>
  (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(func(req, res, next)).catch(next);
  };
