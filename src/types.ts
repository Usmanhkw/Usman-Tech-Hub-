export interface Product {
  id: number;
  title: string;
  desc: string;
  price: number;
  approved: boolean;
  category: string;
  image?: string;
}

export interface User {
  name: string;
  email: string;
  role: 'admin' | 'customer';
}

export interface CartItem extends Product {
  quantity: number;
}
