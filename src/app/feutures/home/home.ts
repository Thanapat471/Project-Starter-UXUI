import { Component, signal } from '@angular/core';
import { NgFor, NgIf, NgClass, NgStyle } from '@angular/common';

interface Product {
  id: number;
  name: string;
  desc: string;
  price: number;
  img: string;
  category: string;
  isNew?: boolean;
  isFeatured?: boolean;
  discountPercent?: number;
  colors?: string[];
}

@Component({
  selector: 'app-home',
  imports: [NgFor, NgIf, NgClass],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  products = signal<Product[]>([
    { 
      id: 1, 
      name: 'Air Pro Sneaker', 
      desc: 'Lightweight minimal running shoe with cushioned sole', 
      price: 129, 
      img: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80',
      category: 'footwear',
      isNew: true,
      colors: ['black', 'white', 'gray']
    },
    { 
      id: 2, 
      name: 'Studio Pro Headphones', 
      desc: 'Wireless noise-cancelling headphones with premium sound', 
      price: 199, 
      img: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
      category: 'technology',
      isFeatured: true,
      colors: ['black', 'white']
    },
    { 
      id: 3, 
      name: 'Minimal Watch', 
      desc: 'Smart watch with health monitoring and notifications', 
      price: 249, 
      img: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=600&q=80',
      category: 'accessories',
      isNew: true,
      isFeatured: true,
      colors: ['black', 'silver', 'gold']
    },
    { 
      id: 4, 
      name: 'Urban Backpack', 
      desc: 'Minimalist waterproof backpack with laptop compartment', 
      price: 89, 
      img: 'https://images.unsplash.com/photo-1491637639811-60e2756cc1c7?auto=format&fit=crop&w=600&q=80',
      category: 'accessories',
      discountPercent: 15
    },
    { 
      id: 5, 
      name: 'Minimal Desk Lamp', 
      desc: 'Adjustable LED desk lamp with wireless charging base', 
      price: 79, 
      img: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      category: 'home',
      isNew: true
    },
    { 
      id: 6, 
      name: 'Wireless Earbuds', 
      desc: 'True wireless earbuds with premium sound quality', 
      price: 129, 
      img: 'https://images.unsplash.com/photo-1605464315542-bda3e2f4e605?auto=format&fit=crop&w=600&q=80',
      category: 'technology',
      isFeatured: true
    }
  ]);

  selectedCategory = signal<string | null>(null);

  addToCart(product: Product) {
    console.log('Add to cart', product);
  }

  addToWishlist(product: Product) {
    console.log('Add to wishlist', product);
  }

  quickView(product: Product) {
    console.log('Quick view', product);
  }

  filterByCategory(category: string | null) {
    this.selectedCategory.set(category);
  }

  calculateDiscountedPrice(price: number, discountPercent?: number): number {
    if (!discountPercent) return price;
    return price - (price * (discountPercent / 100));
  }
}
