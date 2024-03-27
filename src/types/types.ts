import type { NextFunction, Request, Response } from 'express';

export interface IUser extends Document {
  name: string;
  photo: string;
  gender: 'male' | 'female';
  _id: string;
  role: 'admin' | 'user';
  dob: Date;
  createdAt: Date;
  updatedAt: Date;
  // Virtual Attribute
  age: number;
}

export type NewUserRequestBody = Omit<
  IUser,
  'createdAt' | 'updatedAt' | 'age' | 'role'
> & { email: string };

export type NewProductRequestBody = {
  name: string;
  category: string;
  price: number;
  stock: number;
  photo?: string;
};

export type ControllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, string | number | boolean>>>;

type SearchRequestQueryType<T> = {
  search: T;
  price: T;
  category: T;
  sort: T;
  page: T;
};

export type SearchRequestQuery<T> = Partial<SearchRequestQueryType<T>>;
export type OrderRequestQuery<T> = {
  id?: T;
};

export interface BaseQueryType {
  name?: {
    $regex: string;
    $options: string;
  };
  price?: { $lte: number };
  category?: string;
}

export type invalidateCacheType = {
  product?: boolean;
  order?: boolean;
  admin?: boolean;
  userID?: string;
  orderID?: string;
  productID?: string | Array<string>;
};

export type ShippingInfoType = {
  address: string;
  city: string;
  state: string;
  country: string;
  pinCode: number;
};

export type OrderItemType = {
  name: string;
  photo: string;
  price: number;
  quantity: number;
  productID: string;
};

export interface NewOrderRequestBody {
  shippingInfo: ShippingInfoType;
  user: string;
  subTotal: number;
  tax: number;
  shippingCharges: number;
  discount: number;
  total: number;
  orderItems: Array<OrderItemType>;
}

export interface NewPaymentRequestBody {
  coupon?: string;
  amount: number;
}
