'use client';

import { useAdminStore } from '@/lib/admin-store';
import { formatIQD, formatDate } from '@/lib/format';
import { Package, DollarSign, ShoppingBag, Users, Plus, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';

function StatCard({ icon, label, value, change, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change?: string;
  color: string;
}) {
  return (
    <div className="bg-bg-card rounded-2xl border border-border p-5 hover:border-bg-hover transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-text-secondary">{label}</p>
          <p className="text-2xl font-bold text-text-primary mt-1 font-inter">{value}</p>
          {change && (
            <p className="text-xs text-success mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {change}
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { orders, products, customers, dailySales } = useAdminStore();

  const thisMonthOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d.getMonth() === 3 && d.getFullYear() === 2026;
  });

  const totalRevenue = thisMonthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const activeProducts = products.filter(p => p.inStock).length;
  const newCustomers = customers.filter(c => {
    const d = new Date(c.createdAt);
    return d.getMonth() === 3 && d.getFullYear() === 2026;
  }).length;

  const pendingOrders = orders.filter(o => o.status === 'processing').length;

  const last7Days = dailySales.slice(-7);
  const maxRevenue = Math.max(...last7Days.map(d => d.revenue), 1);

  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const statusLabels: Record<string, string> = {
    processing: 'قيد المراجعة',
    confirmed: 'مؤكد',
    in_transit: 'في الطريق',
    delivered: 'تم التسليم',
    cancelled: 'ملغي',
  };

  const statusColors: Record<string, string> = {
    processing: 'bg-warning/10 text-warning',
    confirmed: 'bg-accent/10 text-accent',
    in_transit: 'bg-accent/10 text-accent',
    delivered: 'bg-success/10 text-success',
    cancelled: 'bg-danger/10 text-danger',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<ShoppingBag className="w-5 h-5 text-accent" />}
          label="إجمالي الطلبات"
          value={thisMonthOrders.length.toString()}
          change="+12% من الشهر الماضي"
          color="bg-accent/10"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-success" />}
          label="الإيرادات"
          value={formatIQD(totalRevenue)}
          change="+8% من الشهر الماضي"
          color="bg-success/10"
        />
        <StatCard
          icon={<Package className="w-5 h-5 text-warning" />}
          label="المنتجات النشطة"
          value={activeProducts.toString()}
          color="bg-warning/10"
        />
        <StatCard
          icon={<Users className="w-5 h-5 text-purple-400" />}
          label="العملاء الجدد"
          value={newCustomers.toString()}
          change="+3 هذا الشهر"
          color="bg-purple-400/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-bg-card rounded-2xl border border-border p-5">
          <h3 className="text-base font-semibold text-text-primary mb-4">إيرادات آخر 7 أيام</h3>
          <div className="flex items-end gap-2 h-48">
            {last7Days.map((day, i) => {
              const height = (day.revenue / maxRevenue) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-text-muted font-inter">{(day.revenue / 1000000).toFixed(1)}M</span>
                  <div className="w-full bg-bg-secondary rounded-t-lg relative overflow-hidden" style={{ height: `${height}%` }}>
                    <div className="absolute inset-0 bg-accent/30 hover:bg-accent/50 transition-colors rounded-t-lg" />
                  </div>
                  <span className="text-[10px] text-text-muted font-inter">{day.date.slice(8)}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl border border-border p-5">
          <h3 className="text-base font-semibold text-text-primary mb-4">إجراءات سريعة</h3>
          <div className="space-y-2">
            <Link href="/dashboard/products" className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary hover:bg-bg-hover transition-colors">
              <Plus className="w-4 h-4 text-accent" />
              <span className="text-sm text-text-primary">إضافة منتج جديد</span>
            </Link>
            <Link href="/dashboard/orders" className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary hover:bg-bg-hover transition-colors">
              <Clock className="w-4 h-4 text-warning" />
              <span className="text-sm text-text-primary">الطلبات المعلقة ({pendingOrders})</span>
            </Link>
            <Link href="/dashboard/reviews" className="flex items-center gap-3 p-3 rounded-xl bg-bg-secondary hover:bg-bg-hover transition-colors">
              <Package className="w-4 h-4 text-success" />
              <span className="text-sm text-text-primary">مراجعة التقييمات</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-text-primary">آخر الطلبات</h3>
          <Link href="/dashboard/orders" className="text-sm text-accent hover:text-accent-hover transition-colors">عرض الكل</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-right py-3 px-2 text-text-secondary font-medium">رقم الطلب</th>
                <th className="text-right py-3 px-2 text-text-secondary font-medium">العميل</th>
                <th className="text-right py-3 px-2 text-text-secondary font-medium">المبلغ</th>
                <th className="text-right py-3 px-2 text-text-secondary font-medium">الحالة</th>
                <th className="text-right py-3 px-2 text-text-secondary font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map(order => (
                <tr key={order.id} className="border-b border-border/50 hover:bg-bg-secondary/50 transition-colors">
                  <td className="py-3 px-2 text-text-primary font-inter">{order.orderNumber}</td>
                  <td className="py-3 px-2 text-text-primary">{order.customerName}</td>
                  <td className="py-3 px-2 text-text-primary font-inter">{formatIQD(order.totalAmount)}</td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-text-secondary font-inter">{formatDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
