'use client';

import { useState } from 'react';
import { useAdminStore } from '@/lib/admin-store';
import { Brand } from '@/types/admin';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ImageUpload from '@/components/ui/ImageUpload';
import { Plus, Edit3, Trash2, Globe, ArrowUp, ArrowDown } from 'lucide-react';

const brandLogoHints = [
  'الأفضل: 512x512 بكسل.',
  'النسبة الموصى بها: 1:1 لأن الشعار يظهر داخل مساحات مربعة صغيرة.',
  'يفضل PNG أو SVG بخلفية شفافة مع هامش بسيط حول الشعار.',
];

function normalizeBrandSlug(value: string, fallback: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || fallback;
}

export default function BrandsPage() {
  const { brands, products, addBrand, updateBrand, deleteBrand } = useAdminStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', logo: '', country: '', isActive: true });

  const orderedBrands = brands
    .map((brand, index) => ({
      ...brand,
      sortOrder: brand.sortOrder && brand.sortOrder > 0 ? brand.sortOrder : index + 1,
    }))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name));

  const brandsWithCount = orderedBrands.map(b => ({
    ...b,
    productCount: products.filter(p => p.brandId === b.id).length,
  }));

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', slug: '', logo: '', country: '', isActive: true });
    setShowForm(true);
  };

  const openEdit = (brand: Brand) => {
    setEditing(brand);
    setForm({ name: brand.name, slug: brand.slug, logo: brand.logo || '', country: brand.country || '', isActive: brand.isActive });
    setShowForm(true);
  };

  const handleSave = () => {
    const id = editing?.id || `brand-${Date.now()}`;
    const brand: Brand = {
      id,
      name: form.name,
      slug: normalizeBrandSlug(form.slug || form.name, id),
      logo: form.logo || undefined,
      country: form.country || undefined,
      isActive: form.isActive,
      sortOrder: editing?.sortOrder ?? orderedBrands.length + 1,
    };
    if (editing) updateBrand(brand);
    else addBrand(brand);
    setShowForm(false);
  };

  const moveBrand = (brandId: string, direction: 'up' | 'down') => {
    const currentIndex = orderedBrands.findIndex((brand) => brand.id === brandId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedBrands.length) {
      return;
    }

    const current = orderedBrands[currentIndex];
    const target = orderedBrands[targetIndex];
    updateBrand({ ...current, sortOrder: target.sortOrder });
    updateBrand({ ...target, sortOrder: current.sortOrder });
  };

  return (
    <>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button onClick={openAdd}><Plus className="w-4 h-4" />إضافة براند</Button>
          <span className="text-sm text-text-secondary">{brands.length} براند</span>
        </div>

        <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/30">
                  <th className="text-right py-3 px-4 text-text-secondary font-medium min-w-[200px]">البراند</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">البلد</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">المنتجات</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">الحالة</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">الترتيب</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium w-28">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {brandsWithCount.map((brand, index) => (
                  <tr key={brand.id} className="border-b border-border/50 hover:bg-bg-secondary/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-bg-secondary rounded-xl flex items-center justify-center shrink-0 overflow-hidden border border-border">
                          {brand.logo ? (
                            <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" />
                          ) : (
                            <Globe className="w-4 h-4 text-text-muted" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">{brand.name}</p>
                          <p className="text-xs text-text-muted font-inter">{brand.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-text-secondary text-xs">{brand.country || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="text-text-primary font-inter">{brand.productCount}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${brand.isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                        {brand.isActive ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveBrand(brand.id, 'up')}
                          disabled={index === 0}
                          title="رفع البراند: يظهر أقرب لليمين في الموقع"
                          className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveBrand(brand.id, 'down')}
                          disabled={index === brandsWithCount.length - 1}
                          title="خفض البراند: يظهر أقرب لليسار في الموقع"
                          className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <span className="mr-2 text-xs text-text-muted font-inter">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(brand)} className="p-1.5 rounded-lg text-text-muted hover:text-warning hover:bg-warning/10 transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm('حذف البراند؟')) deleteBrand(brand.id); }} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {brandsWithCount.length === 0 && (
                  <tr><td colSpan={6} className="py-8 text-center text-text-muted">لا توجد براندات مضافة</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'تعديل البراند' : 'إضافة براند جديد'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">اسم البراند *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">الرابط (slug)</label>
            <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent font-inter" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">البلد</label>
            <input type="text" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">اللوجو</label>
            <ImageUpload
              value={form.logo}
              onChange={img => setForm({ ...form, logo: img })}
              hints={brandLogoHints}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 accent-accent" />
            <span className="text-sm text-text-primary">نشط</span>
          </label>
          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={!form.name}>{editing ? 'حفظ' : 'إضافة'}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>إلغاء</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
