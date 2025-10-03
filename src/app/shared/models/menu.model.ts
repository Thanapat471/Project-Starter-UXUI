export interface MenuCategory {
  id: string;
  name: string;
}

export interface MenuOption {
  id: number;
  name: string;
  type: string;
  options: {
    value: string;
    price: number;
  }[];
  isRequired: boolean;
  maxSelections: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  category: MenuCategory;
  imageUrl: string;
  isAvailable: boolean;
  options: MenuOption[];
}

export interface OrderOption {
  menuOptionId: number;
  selectedValue: string;
}

export interface OrderItem {
  menuItemId: number;
  quantity: number;
  options?: OrderOption[];
  notes?: string;
}

export interface CreateOrderRequest {
  items: OrderItem[];
  source?: 'COUNTER' | 'TABLE_QR';
  sessionId?: string;
  notes?: string;
}

export interface Order {
  id: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'READY' | 'SERVED';
  total: number;
  source: 'COUNTER' | 'TABLE_QR';
  notes?: string;
  table?: {
    id: number;
    code: string;
    name: string;
  };
  sessionId?: string;
  items: {
    id: number;
    menuItemId: number;
    menuItem: {
      id: number;
      name: string;
      price: number;
    };
    quantity: number;
    price: number;
    total: number;
    options: {
      id: number;
      menuOptionId: number;
      optionName: string;
      optionType: string;
      selectedValue: string;
      additionalPrice: number;
    }[];
  }[];
  createdAt: string;
}
