// ============================================
// Unified Types — Shared between Admin & Storefront
// ============================================

export type AdminRole = 'admin' | 'employee';
export type ProfileRole = AdminRole | 'customer';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  avatar?: string;
  lastLogin: string;
  isActive: boolean;
}

// ── Vehicle & Specs ──────────────────────────

export type VehicleType = 'fuel' | 'electric';

export type SpecFieldType = 'number' | 'text' | 'select' | 'boolean';

export interface SpecField {
  id: string;
  label: string;
  unit?: string;
  type: SpecFieldType;
  options?: string[];
}

export interface SpecTemplate {
  id: string;
  name: string;
  icon: string;
  categoryId?: string;
  fields: SpecField[];
  createdAt: string;
  updatedAt: string;
}

// ── Products (Unified) ──────────────────────

export interface Product {
  id: string;
  name: string;
  nameEn?: string;
  slug?: string;
  brandId: string;
  brandName: string;
  categoryId: string;
  categoryName: string;
  vehicleType?: VehicleType;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  images?: string[];
  description?: string;
  specTemplateId?: string;
  specs?: Record<string, string | number | boolean>;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Categories (Unified) ────────────────────

export interface Subcategory {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  icon?: string;
  parentId?: string;
  subcategories?: Subcategory[];
  productCount: number;
  isActive: boolean;
  sortOrder?: number;
}

// ── Brands (Unified) ────────────────────────

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  country?: string;
  isActive: boolean;
  sortOrder?: number;
}

// ── Orders (Unified) ────────────────────────

export type OrderStatus = 'processing' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled';

export type PaymentMethod = 'cod' | 'bank_transfer' | 'credit_card' | 'zaincash' | 'qi';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
}

export interface TrackingEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  completed: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: OrderItem[];
  subtotal?: number;
  shippingCost?: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentLabel?: string;
  shippingAddress: string;
  trackingCode?: string;
  timeline?: TrackingEvent[];
  notes?: string;
  placedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Customers ───────────────────────────────

export interface Customer {
  id: string;
  name: string;
  displayName?: string;
  email: string;
  phone: string;
  address?: string;
  ordersCount: number;
  totalSpent: number;
  createdAt: string;
  isActive: boolean;
  lastOrderAt?: string;
  updatedAt?: string;
}

// ── Reviews ─────────────────────────────────

export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerId: string;
  userId?: string;
  customerName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

// ── Comparisons ─────────────────────────────

export interface Comparison {
  id: string;
  title: string;
  slug?: string;
  productIds: string[];
  createdAt: string;
  isFeatured: boolean;
}

// ── Hero Banners (NEW) ──────────────────────

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonHref: string;
  image?: string;
  gradient?: string;
  icon?: string;
  size: 'large' | 'small';
  sortOrder: number;
  isActive: boolean;
}

// ── Navigation (NEW) ────────────────────────

export interface NavItemChild {
  id: string;
  label: string;
  href: string;
}

export interface NavItemFeatured {
  title: string;
  image?: string;
  href: string;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  children?: NavItemChild[];
  featured?: NavItemFeatured;
  sortOrder: number;
}

// ── Trust Features (NEW) ────────────────────

export interface TrustFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
  sortOrder: number;
}

// ── Social Links (NEW) ──────────────────────

export interface SocialLink {
  id: string;
  platform: 'facebook' | 'instagram' | 'x' | 'youtube' | 'whatsapp' | 'telegram' | 'tiktok';
  url: string;
  isActive: boolean;
}

// ── Expenses ────────────────────────────────

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  createdBy: string;
}

// ── Site Settings (Unified) ─────────────────

export interface SiteSettings {
  storeName: string;
  storeDescription: string;
  storeLogo?: string;
  storePhone?: string;
  storeEmail?: string;
  storeAddress?: string;
  shippingProvinces: { name: string; price: number }[];
  paymentMethods: { id: string; name: string; isActive: boolean }[];
  currency: string;
  returnPolicy: string;
  termsConditions: string;
  privacyPolicy: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  socialLinks: SocialLink[];
  trustFeatures: TrustFeature[];
  footerCopyright?: string;
}

// ── Analytics ───────────────────────────────

export interface DailySales {
  date: string;
  orders: number;
  revenue: number;
}

// ── Notifications ───────────────────────────

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'review' | 'system';
  isRead: boolean;
  createdAt: string;
}
