import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzBadgeModule } from 'ng-zorro-antd/badge';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

@Component({
  selector: 'app-counter-order',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzTagModule,
    NzBadgeModule
  ],
  templateUrl: './counter-order.component.html',
  styleUrls: ['./counter-order.component.css']
})
export class CounterOrderComponent {
  searchTerm = signal<string>('');
  selectedCategory = signal<string>('ทั้งหมด');
  cart = signal<CartItem[]>([
    { id: '1', name: 'ชาเย็นใส่นม่า', price: 120, quantity: 1, total: 120 },
    { id: '2', name: 'แอสเพรสโซ่', price: 95, quantity: 1, total: 95 }
  ]);

  categories = ['ทั้งหมด', 'กาแฟ', 'ชา', 'เครื่องดื่มเย็น', 'ขนม', 'อาหาร'];

  menuItems: MenuItem[] = [
    { id: '1', name: 'เอสเพรสโซ่', description: 'กาแฟเข้มข้น คั่วคะแมนสเอียน', price: 45, category: 'กาแฟ', imageUrl: 'https://images.unsplash.com/photo-1510707577770-8b980a9c5dd2?w=300&h=200&fit=crop' },
    { id: '2', name: 'ลาเต้', description: 'กาแฟผสมนมสดมสเอียน', price: 65, category: 'กาแฟ', imageUrl: 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=300&h=200&fit=crop' },
    { id: '3', name: 'คาปูชิโน่', description: 'กาแฟใส่นมข้นหวาน', price: 65, category: 'กาแฟ', imageUrl: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=300&h=200&fit=crop' },
    { id: '4', name: 'อมริกาโน่', description: 'กาแฟดำใส่น้ำสุเมิร์ก', price: 50, category: 'กาแฟ', imageUrl: 'https://images.unsplash.com/photo-1497636577773-f1231844b336?w=300&h=200&fit=crop' },
    { id: '5', name: 'มอคค่า', description: 'กาแฟผสมช็อกโกแลต', price: 75, category: 'กาแฟ', imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop' },
    { id: '6', name: 'ชาเขียว', description: 'ชาเขียวปัญญาชน', price: 45, category: 'ชา', imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&h=200&fit=crop' },
    { id: '7', name: 'ชานมไข่มุก', description: 'ชานมหวานา ใส่ไข่มุก', price: 60, category: 'ชา', imageUrl: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?w=300&h=200&fit=crop' },
    { id: '8', name: 'ชานสลี', description: 'ชานตรอมกรม', price: 40, category: 'ชา', imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&h=200&fit=crop' },
    { id: '9', name: 'น้ำลื่นเค้ก', description: 'น้ำล้มมโครขนม', price: 75, category: 'เครื่องดื่มเย็น', imageUrl: 'https://images.unsplash.com/photo-1546173159-315724a31696?w=300&h=200&fit=crop' },
    { id: '10', name: 'สมูทตี่ผลไม้รวม', description: 'ผลไม่ระบอมป่า คลับย', price: 85, category: 'เครื่องดื่มเย็น', imageUrl: 'https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=300&h=200&fit=crop' }
  ];

  constructor(private router: Router) {}

  get filteredMenuItems() {
    const items = this.menuItems;
    const search = this.searchTerm().toLowerCase();
    const category = this.selectedCategory();

    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search) || 
                           item.description.toLowerCase().includes(search);
      const matchesCategory = category === 'ทั้งหมด' || item.category === category;
      return matchesSearch && matchesCategory;
    });
  }

  get cartTotal() {
    return this.cart().reduce((total, item) => total + item.total, 0);
  }

  get cartItemCount() {
    return this.cart().reduce((total, item) => total + item.quantity, 0);
  }

  selectCategory(category: string) {
    this.selectedCategory.set(category);
  }

  addToCart(menuItem: MenuItem) {
    const currentCart = this.cart();
    const existingItem = currentCart.find(item => item.id === menuItem.id);

    if (existingItem) {
      const updatedCart = currentCart.map(item => 
        item.id === menuItem.id 
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      );
      this.cart.set(updatedCart);
    } else {
      const newItem: CartItem = {
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: 1,
        total: menuItem.price
      };
      this.cart.set([...currentCart, newItem]);
    }
  }

  updateCartItemQuantity(itemId: string, newQuantity: number) {
    if (newQuantity <= 0) {
      this.removeFromCart(itemId);
      return;
    }

    const updatedCart = this.cart().map(item =>
      item.id === itemId
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
        : item
    );
    this.cart.set(updatedCart);
  }

  removeFromCart(itemId: string) {
    const updatedCart = this.cart().filter(item => item.id !== itemId);
    this.cart.set(updatedCart);
  }

  goBack() {
    this.router.navigate(['/features/dashboard']);
  }

  onSearch(value: string) {
    this.searchTerm.set(value);
  }

  onImageError(event: any) {
    event.target.src = 'https://images.unsplash.com/photo-1546173159-315724a31696?w=300&h=200&fit=crop';
  }
}