'use client';

import { useState, useMemo } from 'react';
import { useAdminStore } from '@/lib/admin-store';
import { Category, Subcategory } from '@/types/admin';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Plus, Edit3, Trash2, FolderOpen, X, ChevronDown, ChevronUp } from 'lucide-react';

const categoryIcons = ['🏍️', '⚡', '🛵', '🔧', '🪖', '🛡️', '⚙️', '📦', '🎯', '🔩', '🏎️', '🔋', '💡', '🎨', '🧰'];

export default function CategoriesPage() {
  const { categories, products, addCategory, updateCategory, deleteCategory } = useAdminStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', isActive: true, icon: '📦' });
  const [formSubs, setFormSubs] = useState<Subcategory[]>([]);
  const [newSubName, setNewSubName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categoriesWithCount = useMemo(() => {
    return categories.map(c => ({
      ...c,
      productCount: products.filter(p => p.categoryId === c.id).length,
    }));
  }, [categories, products]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '', isActive: true, icon: '📦' });
    setFormSubs([]);
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', isActive: cat.isActive, icon: cat.icon || '📦' });
    setFormSubs(cat.subcategories || []);
    setShowForm(true);
  };

  const addSubcategory = () => {
    if (!newSubName.trim()) return;
    const sub: Subcategory = {
      id: `sc-${Date.now()}`,
      name: newSubName.trim(),
      slug: newSubName.trim().toLowerCase().replace(/\s+/g, '-'),
    };
    setFormSubs(prev => [...prev, sub]);
    setNewSubName('');
  };

  const removeSubcategory = (id: string) => {
    setFormSubs(prev => prev.filter(s => s.id !== id));
  };

  const handleSave = () => {
    const category: Category = {
      id: editing?.id || `cat-${Date.now()}`,
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
      description: form.description || undefined,
      icon: form.icon,
      subcategories: formSubs.length > 0 ? formSubs : undefined,
      isActive: form.isActive,
      productCount: 0,
    };
    if (editing) {
      updateCategory(category);
    } else {
      addCategory(category);
    }
    setShowForm(false);
  };

  return (
    <>
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button onClick={openAdd}><Plus className="w-4 h-4" />إضافة قسم</Button>
          <span className="text-sm text-text-secondary">{categories.length} قسم</span>
        </div>

        <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/30">
                  <th className="text-right py-3 px-4 text-text-secondary font-medium min-w-[200px]">القسم</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">الأقسام الفرعية</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">المنتجات</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium">الحالة</th>
                  <th className="text-right py-3 px-4 text-text-secondary font-medium w-24">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {categoriesWithCount.map(cat => (
                  <tr key={cat.id} className="border-b border-border/50 hover:bg-bg-secondary/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center shrink-0 text-lg">
                          {cat.icon || <FolderOpen className="w-5 h-5 text-accent" />}
                        </div>
                        <div>
                          <p className="font-semibold text-text-primary">{cat.name}</p>
                          <p className="text-xs text-text-muted font-inter">{cat.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {cat.subcategories && cat.subcategories.length > 0 ? (
                        <div>
                          <button
                            onClick={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
                            className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
                          >
                            <span className="font-medium">{cat.subcategories.length} أقسام فرعية</span>
                            {expandedId === cat.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                          {expandedId === cat.id && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {cat.subcategories.map(sub => (
                                <span key={sub.id} className="inline-flex px-2 py-0.5 rounded-md bg-bg-secondary border border-border text-[11px] text-text-secondary">
                                  {sub.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-text-primary font-inter">{cat.productCount}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-xs font-medium ${cat.isActive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                        {cat.isActive ? 'نشط' : 'معطل'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-text-muted hover:text-warning hover:bg-warning/10 transition-colors">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm('حذف القسم؟')) deleteCategory(cat.id); }} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {categoriesWithCount.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-muted">لا توجد أقسام مضافة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editing ? 'تعديل القسم' : 'إضافة قسم جديد'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">اسم القسم *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">الرابط (slug)</label>
            <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent font-inter" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-2">الأيقونة</label>
            <div className="flex flex-wrap gap-2">
              {categoryIcons.map(icon => (
                <button key={icon} onClick={() => setForm({ ...form, icon })}
                  className={`w-10 h-10 rounded-xl border text-lg flex items-center justify-center transition-all ${form.icon === icon ? 'border-accent bg-accent/10 scale-110 shadow-lg shadow-accent/20' : 'border-border hover:bg-bg-secondary'}`}>
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">الوصف</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent resize-none" />
          </div>

          {/* Subcategories */}
          <div>
            <label className="block text-sm text-text-secondary mb-2">الأقسام الفرعية</label>
            {formSubs.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {formSubs.map(sub => (
                  <span key={sub.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bg-secondary border border-border text-xs text-text-primary">
                    {sub.name}
                    <button onClick={() => removeSubcategory(sub.id)} className="text-text-muted hover:text-danger transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubName}
                onChange={e => setNewSubName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSubcategory(); } }}
                placeholder="أضف قسم فرعي..."
                className="flex-1 bg-bg-secondary border border-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
              />
              <button
                onClick={addSubcategory}
                disabled={!newSubName.trim()}
                className="px-3 py-2 rounded-xl bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors disabled:opacity-30"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
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
