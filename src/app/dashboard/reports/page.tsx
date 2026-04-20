'use client';

import { useAdminStore } from '@/lib/admin-store';
import { useMemo, useState } from 'react';
import { formatIQD, formatDate } from '@/lib/format';
import { Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export default function ReportsPage() {
  const { orders, products, expenses, categories, addExpense, deleteExpense } = useAdminStore();
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expForm, setExpForm] = useState({ description: '', amount: '', category: '' });

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.totalAmount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  const salesByCategory = useMemo(() => {
    return categories.map(cat => {
      const catProducts = products.filter(p => p.categoryId === cat.id);
      const catRevenue = orders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => {
          const catItems = o.items.filter(item => catProducts.some(p => p.id === item.productId));
          return sum + catItems.reduce((s, i) => s + i.price * i.quantity, 0);
        }, 0);
      return { name: cat.name, revenue: catRevenue };
    }).filter(c => c.revenue > 0);
  }, [orders, products, categories]);

  const maxCatRevenue = Math.max(...salesByCategory.map(c => c.revenue), 1);

  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string; sold: number; revenue: number }> = {};
    orders.filter(o => o.status !== 'cancelled').forEach(o => {
      o.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.productName, sold: 0, revenue: 0 };
        }
        productSales[item.productId].sold += item.quantity;
        productSales[item.productId].revenue += item.price * item.quantity;
      });
    });
    return Object.entries(productSales).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);
  }, [orders]);

  const handleAddExpense = () => {
    addExpense({
      id: `exp-${Date.now()}`,
      description: expForm.description,
      amount: Number(expForm.amount),
      category: expForm.category,
      date: new Date().toISOString(),
      createdBy: 'admin-1',
    });
    setExpForm({ description: '', amount: '', category: '' });
    setShowExpenseForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-bg-card rounded-2xl border border-border p-5">
          <p className="text-sm text-text-secondary">إجمالي الإيرادات</p>
          <p className="text-xl font-bold text-success mt-1 font-inter">{formatIQD(totalRevenue)}</p>
        </div>
        <div className="bg-bg-card rounded-2xl border border-border p-5">
          <p className="text-sm text-text-secondary">إجمالي المصروفات</p>
          <p className="text-xl font-bold text-danger mt-1 font-inter">{formatIQD(totalExpenses)}</p>
        </div>
        <div className="bg-bg-card rounded-2xl border border-border p-5">
          <p className="text-sm text-text-secondary">صافي الربح</p>
          <p className={`text-xl font-bold mt-1 font-inter ${netProfit >= 0 ? 'text-success' : 'text-danger'}`}>{formatIQD(netProfit)}</p>
        </div>
        <div className="bg-bg-card rounded-2xl border border-border p-5">
          <p className="text-sm text-text-secondary">متوسط قيمة الطلب</p>
          <p className="text-xl font-bold text-accent mt-1 font-inter">{formatIQD(avgOrderValue)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-bg-card rounded-2xl border border-border p-5">
          <h3 className="text-base font-semibold text-text-primary mb-4">المبيعات حسب القسم</h3>
          <div className="space-y-3">
            {salesByCategory.map(cat => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-text-primary">{cat.name}</span>
                  <span className="text-xs text-text-muted font-inter">{formatIQD(cat.revenue)}</span>
                </div>
                <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-accent/50 rounded-full" style={{ width: `${(cat.revenue / maxCatRevenue) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl border border-border p-5">
          <h3 className="text-base font-semibold text-text-primary mb-4">أفضل المنتجات مبيعاً</h3>
          <div className="space-y-2">
            {topProducts.map(([id, data], i) => (
              <div key={id} className="flex items-center gap-3 p-2 rounded-xl bg-bg-secondary/50">
                <span className="w-6 h-6 bg-accent/10 rounded-lg flex items-center justify-center text-xs text-accent font-inter">{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm text-text-primary">{data.name}</p>
                  <p className="text-xs text-text-muted">مبيعات: {data.sold}</p>
                </div>
                <span className="text-sm text-text-primary font-inter">{formatIQD(data.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-text-primary">المصروفات</h3>
          <Button size="sm" onClick={() => setShowExpenseForm(true)}><Plus className="w-3 h-3" />إضافة مصروف</Button>
        </div>
        <div className="space-y-2">
          {expenses.map(exp => (
            <div key={exp.id} className="flex items-center justify-between p-3 bg-bg-secondary/50 rounded-xl">
              <div>
                <p className="text-sm text-text-primary">{exp.description}</p>
                <p className="text-xs text-text-muted">{exp.category} • {formatDate(exp.date)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-danger font-inter">{formatIQD(exp.amount)}</span>
                <button onClick={() => deleteExpense(exp.id)} className="p-1 rounded text-text-muted hover:text-danger"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={showExpenseForm} onClose={() => setShowExpenseForm(false)} title="إضافة مصروف">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">الوصف *</label>
            <input type="text" value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">المبلغ *</label>
            <input type="number" value={expForm.amount} onChange={e => setExpForm({ ...expForm, amount: e.target.value })}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">التصنيف</label>
            <input type="text" value={expForm.category} onChange={e => setExpForm({ ...expForm, category: e.target.value })}
              placeholder="مثال: إيجار، رواتب، تسويق"
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent" />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleAddExpense} disabled={!expForm.description || !expForm.amount}>إضافة</Button>
            <Button variant="secondary" onClick={() => setShowExpenseForm(false)}>إلغاء</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
