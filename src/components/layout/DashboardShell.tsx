'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminStore } from '@/lib/admin-store';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const adminOnlyPaths = new Set([
  '/dashboard/team',
  '/dashboard/settings',
  '/dashboard/reports',
]);

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { currentUser, hydrated, loading } = useAdminStore();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !loading && !currentUser) {
      router.push('/');
    }
  }, [hydrated, loading, currentUser, router]);

  useEffect(() => {
    if (
      hydrated &&
      !loading &&
      currentUser &&
      currentUser.role !== 'admin' &&
      adminOnlyPaths.has(pathname)
    ) {
      router.push('/dashboard');
    }
  }, [currentUser, hydrated, loading, pathname, router]);

  if (!hydrated || loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:mr-64">
        <TopBar
          title={getPageTitle(pathname)}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/dashboard': 'الرئيسية',
    '/dashboard/orders': 'إدارة الطلبات',
    '/dashboard/products': 'إدارة المنتجات',
    '/dashboard/categories': 'إدارة الأقسام',
    '/dashboard/customers': 'إدارة العملاء',
    '/dashboard/reviews': 'إدارة التقييمات',
    '/dashboard/comparisons': 'إدارة المقارنات',
    '/dashboard/specs': 'المواصفات الفنية',
    '/dashboard/brands': 'إدارة البراندات',
    '/dashboard/banners': 'إدارة البانرات',
    '/dashboard/reports': 'التقارير المالية',
    '/dashboard/team': 'إدارة الفريق',
    '/dashboard/settings': 'الإعدادات',
  };
  return titles[pathname] || 'لوحة التحكم';
}
