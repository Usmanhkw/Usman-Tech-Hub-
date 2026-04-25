import { Product } from './types';

export const CATEGORIES = [
  "Fast Chargers",
  "Data Cables",
  "Wired Hand-free",
  "Type-C & Lightning Cables",
  "Screen Protectors",
  "High-Capacity Power Banks",
  "Wireless Earbuds",
  "Multi-port Adapters"
];

const generateProducts = (): Product[] => {
  const products: Product[] = [];
  const itemsPerCategory = 6;
  
  CATEGORIES.forEach((cat, catIdx) => {
    for (let i = 1; i <= itemsPerCategory; i++) {
      const id = catIdx * itemsPerCategory + i;
      products.push({
        id,
        title: `${cat} Elite Series ${id}`,
        desc: `Professional grade ${cat.toLowerCase()} designed for durability and maximum efficiency. Compatible with all major brands.`,
        price: Math.floor(450 + (Math.random() * 2500)),
        approved: true,
        category: cat,
        image: `https://images.unsplash.com/photo-1546054454-aa26e2b734c7?auto=format&fit=crop&q=80&w=200&h=200&sig=${id}`
      });
    }
  });
  
  // Add some pending products for admin demo
  for (let i = 1; i <= 5; i++) {
    const id = products.length + 1;
    products.push({
      id,
      title: `Upcoming Pro Cable v${i}`,
      desc: `Exclusive prototype under testing. Not yet released to the public.`,
      price: 1200,
      approved: false,
      category: "Data Cables",
      image: `https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=200&h=200&sig=${id}`
    });
  }

  return products;
};

export const INITIAL_PRODUCTS = generateProducts();

export const ADMIN_CREDENTIALS = {
  email: "hkwpro@gmail.com",
  password: "Usmansarwar8171@"
};
