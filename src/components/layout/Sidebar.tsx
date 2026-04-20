'use client';

import { useAdminStore } from '@/lib/admin-store';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  FolderOpen,
  Users,
  Star,
  GitCompareArrows,
  BarChart3,
  UserCog,
  Settings,
  Bike,
  ChevronRight,
  X,
  Sliders,
  Globe,
  Image,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" />, label: 'الرئيسية' },
  { href: '/dashboard/orders', icon: <ShoppingCart className="w-5 h-5" />, label: 'الطلبات' },
  { href: '/dashboard/products', icon: <Package className="w-5 h-5" />, label: 'المنتجات' },
  { href: '/dashboard/categories', icon: <FolderOpen className="w-5 h-5" />, label: 'الأقسام' },
  { href: '/dashboard/brands', icon: <Globe className="w-5 h-5" />, label: 'البراندات' },
  { href: '/dashboard/banners', icon: <Image className="w-5 h-5" />, label: 'البانرات' },
  { href: '/dashboard/customers', icon: <Users className="w-5 h-5" />, label: 'العملاء' },
  { href: '/dashboard/reviews', icon: <Star className="w-5 h-5" />, label: 'التقييمات' },
  { href: '/dashboard/specs', icon: <Sliders className="w-5 h-5" />, label: 'المواصفات الفنية' },
  { href: '/dashboard/comparisons', icon: <GitCompareArrows className="w-5 h-5" />, label: 'المقارنات' },
  { href: '/dashboard/reports', icon: <BarChart3 className="w-5 h-5" />, label: 'التقارير', adminOnly: true },
  { href: '/dashboard/team', icon: <UserCog className="w-5 h-5" />, label: 'الفريق', adminOnly: true },
  { href: '/dashboard/settings', icon: <Settings className="w-5 h-5" />, label: 'الإعدادات', adminOnly: true },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { currentUser } = useAdminStore();
  const pathname = usePathname();
  const isAdmin = currentUser?.role === 'admin';

  const filteredItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-64 bg-bg-card border-l border-border z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center">
              <Bike className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-base font-bold text-text-primary leading-tight">MotoMall</h1>
              <p className="text-[10px] text-text-muted">لوحة التحكم</p>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden text-text-secondary hover:text-text-primary">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-3 space-y-1 mt-2">
          {filteredItems.map(item => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                }`}
              >
                <span className={isActive ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary'}>{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 text-accent" />}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent/20 rounded-full flex items-center justify-center text-accent font-semibold text-sm">
              {currentUser?.name?.charAt(0) || 'م'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{currentUser?.name || 'مستخدم'}</p>
              <p className="text-xs text-text-muted">
                {currentUser?.role === 'admin' ? 'مدير النظام' : 'موظف'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
