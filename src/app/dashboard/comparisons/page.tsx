'use client';

import { useState, useMemo } from 'react';
import { useAdminStore } from '@/lib/admin-store';
import { Comparison } from '@/types/admin';
import { formatIQD } from '@/lib/format';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import SearchInput from '@/components/ui/SearchInput';
import { Plus, Star, Trash2, Eye } from 'lucide-react';

const higherIsBetterFields = new Set([
  'سعة المحرك', 'القدرة الحصانية', 'عزم الدوران', 'سعة الخزان', 'السرعة القصوى',
  'قوة المحرك', 'سعة البطارية', 'فولتية البطارية', 'المدى',
]);

const lowerIsBetterFields = new Set([
  'الوزن', 'الاستهلاك', 'وقت الشحن', 'ارتفاع المقعد',
]);

export default function ComparisonsPage() {
  const { comparisons, products, specTemplates, addComparison, deleteComparison, toggleComparisonFeatured } = useAdminStore();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewComp, setPreviewComp] = useState<Comparison | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [formTitle, setFormTitle] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);

  const filtered = useMemo(() => {
    return comparisons.filter(c => c.title.includes(search));
  }, [comparisons, search]);

  const productsWithSpecs = useMemo(() => {
    return products.filter(p => p.specs && Object.keys(p.specs).length > 0);
  }, [products]);

  const openAdd = () => {
    setSelectedProductIds([]);
    setFormTitle('');
    setFormFeatured(false);
    setShowForm(true);
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev;
      if (next.length >= 2) {
        const names = next.map(pid => products.find(p => p.id === pid)?.name || '');
        setFormTitle(names.join(' vs '));
      }
      return next;
    });
  };

  const handleSave = () => {
    const comp: Comparison = {
      id: `comp-${Date.now()}`,
      title: formTitle,
      productIds: selectedProductIds,
      createdAt: new Date().toISOString(),
      isFeatured: formFeatured,
    };
    addComparison(comp);
    setShowForm(false);
  };

  const openPreview = (comp: Comparison) => {
    setPreviewComp(comp);
    setShowPreview(true);
  };

  const getComparisonProducts = (comp: Comparison) => {
    return comp.productIds.map(id => products.find(p => p.id === id)).filter(Boolean);
  };

  const getCompareFields = (comp: Comparison) => {
    const compProducts = getComparisonProducts(comp);
    const allKeys = new Set<string>();
    compProducts.forEach(p => {
      if (p?.specs) Object.keys(p.specs).forEach(k => allKeys.add(k));
    });
    const numericFields: string[] = [];
    const textFields: string[] = [];
    allKeys.forEach(key => {
      const firstVal = compProducts.find(p => p?.specs?.[key] !== undefined)?.specs?.[key];
      if (typeof firstVal === 'number') numericFields.push(key);
      else textFields.push(key);
    });
    return { numericFields, textFields };
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={openAdd}><Plus className="w-4 h-4" />إنشاء مقارنة</Button>
        <div className="flex-1 min-w-[200px] max-w-sm">
          <SearchInput value={search} onChange={setSearch} placeholder="بحث بالعنوان..." />
        </div>
        <span className="text-sm text-text-secondary">{filtered.length} مقارنة</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(comp => {
          const compProducts = getComparisonProducts(comp);
          return (
            <div key={comp.id} className={`bg-bg-card rounded-2xl border p-5 transition-all ${comp.isFeatured ? 'border-accent/30 ring-1 ring-accent/10' : 'border-border'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary mb-1">{comp.title}</h3>
                  <span className="text-xs text-text-muted">{comp.productIds.length} منتجات</span>
                </div>
                <button onClick={() => toggleComparisonFeatured(comp.id)}
                  className={`p-1 rounded-lg transition-colors ${comp.isFeatured ? 'text-accent' : 'text-text-muted hover:text-accent'}`}>
                  <Star className={`w-4 h-4 ${comp.isFeatured ? 'fill-accent' : ''}`} />
                </button>
              </div>
              <div className="flex gap-2 mb-3">
                {compProducts.map(p => p && (
                  <div key={p.id} className="bg-bg-secondary rounded-lg px-2 py-1">
                    <p className="text-xs text-text-primary">{p.name}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-3 border-t border-border">
                <Button size="sm" variant="ghost" onClick={() => openPreview(comp)}><Eye className="w-3 h-3" />معاينة</Button>
                <Button size="sm" variant="ghost" onClick={() => deleteComparison(comp.id)} className="text-danger"><Trash2 className="w-3 h-3" /></Button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="إنشاء مقارنة جديدة" size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">اختر المنتجات ذات المواصفات (2-4)</label>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {productsWithSpecs.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-4">لا توجد منتجات بمواصفات فنية</p>
              ) : (
                productsWithSpecs.map(p => (
                  <button
                    key={p.id}
                    onClick={() => toggleProduct(p.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      selectedProductIds.includes(p.id) ? 'border-accent bg-accent/10' : 'border-border hover:bg-bg-secondary'
                    }`}
                  >
                    <span className="text-sm text-text-primary">{p.name}</span>
                    <span className="text-xs text-text-muted font-inter">{formatIQD(p.price)} د.ع</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">عنوان المقارنة</label>
            <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={formFeatured} onChange={e => setFormFeatured(e.target.checked)} className="w-4 h-4 accent-accent" />
            <span className="text-sm text-text-primary">مقارنة مميزة</span>
          </label>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={selectedProductIds.length < 2 || !formTitle}>إنشاء المقارنة</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>إلغاء</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)} title={previewComp?.title || ''} size="xl">
        {previewComp && (() => {
          const compProducts = getComparisonProducts(previewComp);
          const { numericFields, textFields } = getCompareFields(previewComp);

          return (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right py-3 px-3 text-text-secondary font-medium">المواصفة</th>
                    {compProducts.map(p => (
                      <th key={p!.id} className="text-center py-3 px-3">
                        <p className="text-text-primary font-medium">{p!.name}</p>
                        <p className="text-xs text-accent font-inter mt-0.5">{formatIQD(p!.price)} د.ع</p>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {numericFields.map(field => {
                    const values = compProducts.map(p => p!.specs?.[field] as number | undefined).filter(v => v !== undefined) as number[];
                    if (values.length === 0) return null;
                    const isHigherBetter = higherIsBetterFields.has(field);
                    const isLowerBetter = lowerIsBetterFields.has(field);

                    let bestVal: number | null = null;
                    let worstVal: number | null = null;
                    if (values.length > 1 && (isHigherBetter || isLowerBetter)) {
                      bestVal = isHigherBetter ? Math.max(...values) : Math.min(...values);
                      worstVal = isHigherBetter ? Math.min(...values) : Math.max(...values);
                    }

                    const template = specTemplates.find(t =>
                      compProducts.some(p => p!.specTemplateId === t.id)
                    );
                    const fieldDef = template?.fields.find(f => f.label === field);

                    return (
                      <tr key={field} className="border-b border-border/50">
                        <td className="py-2.5 px-3 text-text-secondary">
                          {field}
                          {fieldDef?.unit && <span className="text-text-muted mr-1">({fieldDef.unit})</span>}
                        </td>
                        {compProducts.map(p => {
                          const val = p!.specs?.[field] as number | undefined;
                          return (
                            <td key={p!.id} className={`text-center py-2.5 px-3 font-inter ${
                              val !== undefined && val === bestVal ? 'text-success font-semibold' :
                              val !== undefined && val === worstVal ? 'text-danger/70' : 'text-text-primary'
                            }`}>
                              {val !== undefined ? val : '-'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {textFields.length > 0 && numericFields.length > 0 && (
                    <tr><td colSpan={compProducts.length + 1} className="py-2 px-3"><div className="border-t border-border"></div></td></tr>
                  )}
                  {textFields.map(field => {
                    return (
                      <tr key={field} className="border-b border-border/50">
                        <td className="py-2.5 px-3 text-text-secondary">{field}</td>
                        {compProducts.map(p => {
                          const val = p!.specs?.[field];
                          const display = typeof val === 'boolean' ? (val ? 'نعم' : 'لا') : val ?? '-';
                          return (
                            <td key={p!.id} className="text-center py-2.5 px-3 text-text-primary">
                              {display}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
