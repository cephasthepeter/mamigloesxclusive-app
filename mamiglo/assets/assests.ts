// Type definitions for banners and products
export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: ReturnType<typeof require>;
  buttonText?: string; // text for call-to-action button, e.g. "Get Now"
}

export interface ProductVariantOption {
  value: string;
  additionalPrice?: number;
  stock?: number;
  hex?: string;
}

export interface ProductVariants {
  sizes?: ProductVariantOption[];
  colors?: ProductVariantOption[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: ReturnType<typeof require>;
  description: string;
  rating: number;
  category: string;
  variants?: ProductVariants;
  createdAt?: string;
}

// Format date utility function
export const formatDate = (date: Date | string, format: string = "MM/DD/YYYY"): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const seconds = String(dateObj.getSeconds()).padStart(2, "0");

  const replacements: { [key: string]: string } = {
    DD: day,
    MM: month,
    YYYY: String(year),
    HH: hours,
    mm: minutes,
    ss: seconds,
  };

  return format.replace(/DD|MM|YYYY|HH|mm|ss/g, (match) => replacements[match]);
};

// Slide banners data
export const slideBanners: Banner[] = [
  {
    id: "banner1",
    title: "Summer Collection",
    subtitle: "Discover amazing products at unbeatable prices",
    image: require("./images/Banner1.png"),
    buttonText: "Get Now",
  },
  {
    id: "banner2",
    title: "New Arrivals",
    subtitle: "Check out our latest tech gadgets",
    image: require("./images/Banner2.jpeg"),
    buttonText: "Get Now",
  },
  {
    id: "banner3",
    title: "Flash Sale",
    subtitle: "Up to 50% off on selected items",
    image: require("./images/splash-icon.png"),
    buttonText: "Get Now",
  },
];

// Products data
const now = new Date();
const oneDay = 24 * 60 * 60 * 1000;

export const products: Product[] = [
  {
    id: "prod1",
    name: "Premium Wireless Airpods",
    price: 199.99,
    image: require("./product-images/airpods.jpg"),
    description:
      "High-quality wireless earbuds with active noise cancellation and premium sound quality. Perfect for music lovers and professionals.",
    rating: 4.5,
    category: "audio",
    createdAt: new Date(now.getTime() - 2 * oneDay).toISOString(),
    variants: {
      colors: [
        { value: 'White', hex: '#ffffff' },
        { value: 'Black', hex: '#000000' },
      ],
      sizes: [
        { value: 'Standard', additionalPrice: 0, stock: 12 },
        { value: 'Pro', additionalPrice: 50, stock: 8 },
      ],
    },
  },
  {
    id: "prod2",
    name: "Smart Home Speaker",
    price: 99.99,
    image: require("./product-images/alexa.jpg"),
    description:
      "Voice-controlled smart speaker that works with all your smart home devices. Stream music, control lights, and get instant information.",
    rating: 4.2,
    category: "audio",
    createdAt: new Date(now.getTime() - 5 * oneDay).toISOString(),
  },
  {
    id: "prod3",
    name: "Professional Camera",
    price: 1299.99,
    image: require("./product-images/camera.jpg"),
    description:
      "Capture stunning photos and videos with our professional-grade camera. Perfect for content creators and photography enthusiasts.",
    rating: 4.8,
    category: "cameras",
    createdAt: new Date(now.getTime() - 1 * oneDay).toISOString(),
  },
  {
    id: "prod4",
    name: "Wireless Gaming Mouse",
    price: 79.99,
    image: require("./product-images/mouse.jpg"),
    description:
      "Precision gaming mouse with ergonomic design and customizable buttons. Experience lag-free performance for competitive gaming.",
    rating: 4.3,
    category: "gaming",
    createdAt: new Date(now.getTime() - 3 * oneDay).toISOString(),
  },
  {
    id: "prod5",
    name: "Latest Smartphone",
    price: 999.99,
    image: require("./product-images/phone.jpg"),
    description:
      "State-of-the-art smartphone with cutting-edge technology. Features advanced camera system, long battery life, and 5G connectivity.",
    rating: 4.7,
    category: "electronics",
    createdAt: new Date(now.getTime() - 8 * oneDay).toISOString(),
  },
  {
    id: "prod6",
    name: "Gaming Console",
    price: 499.99,
    image: require("./product-images/playstation.jpg"),
    description:
      "Next-generation gaming console with ultra-high-speed SSD and powerful graphics. Enjoy immersive gaming like never before.",
    rating: 4.6,
    category: "gaming",
    createdAt: new Date(now.getTime() - 10 * oneDay).toISOString(),
  },
];
 