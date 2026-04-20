import type {
  AdminUser,
  Brand,
  Category,
  Comparison,
  Customer,
  HeroBanner,
  Order,
  Product,
  ProfileRole,
  Review,
  SiteSettings,
  SpecTemplate,
} from '@/types/admin';

export interface AdminDashboardSnapshot {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  orders: Order[];
  customers: Customer[];
  reviews: Review[];
  comparisons: Comparison[];
  specTemplates: SpecTemplate[];
  settings: SiteSettings;
  heroBanners: HeroBanner[];
  teamMembers: AdminUser[];
}

export interface TeamRoleMutation {
  userId?: string;
  email?: string;
  role: ProfileRole;
}
