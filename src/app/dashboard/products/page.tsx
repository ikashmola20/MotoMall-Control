'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAdminStore } from '@/lib/admin-store';
import { Product } from '@/types/admin';
import { formatIQD } from '@/lib/format';
import {
  clearDraft,
  loadDraft,
  saveDraft,
  useBeforeUnloadWarning,
} from '@/lib/draft';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import SearchInput from '@/components/ui/SearchInput';
import { Plus, Edit3, Trash2, Eye, Grid3X3, List, ChevronDown, CheckSquare, PackageCheck, PackageX, Percent, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import MultiImageUpload from '@/components/ui/MultiImageUpload';
import Pagination from '@/components/ui/Pagination';

const productImageHints = [
  'الأفضل: 1600x1600 بكسل للصورة الرئيسية وصور المعرض.',
  'النسبة الموصى بها: 1:1 حتى تظهر البطاقات ومعرض المنتج بشكل متناسق.',
  'يفضل وضع المنتج في المنتصف مع خلفية بيضاء أو شفافة وتجنّب القص القريب.',
];

const PRODUCT_DRAFT_KEY = 'motomall:draft:products-form';
const INITIAL_PRODUCT_FORM = {
  name: '',
  brandName: '',
  categoryId: '',
  price: '',
  originalPrice: '',
  discount: '',
  description: '',
  image: '',
  inStock: true,
  isNew: false,
  isBestSeller: false,
};

type ProductDraft = {
  showForm: boolean;
  editingProductId: string | null;
  form: typeof INITIAL_PRODUCT_FORM;
  formImages: string[];
  formSpecTemplateId: string;
  formSpecs: Record<string, string | number | boolean>;
};

export default function ProductsPage() {
  const {
    products,
    categories,
    specTemplates,
    addProduct,
    updateProduct,
    deleteProduct,
    hydrated,
  } = useAdminStore();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDiscount, setBulkDiscount] = useState('');
  const pageSize = 12;
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [viewImageIdx, setViewImageIdx] = useState(0);

  const [form, setForm] = useState(INITIAL_PRODUCT_FORM);
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formSpecTemplateId, setFormSpecTemplateId] = useState('');
  const [formSpecs, setFormSpecs] = useState<Record<string, string | number | boolean>>({});
  const restoredDraftRef = useRef(false);

  const hasUnsavedFormChanges =
    showForm &&
    Boolean(
      form.name.trim() ||
        form.brandName.trim() ||
        form.categoryId ||
        form.price ||
        form.originalPrice ||
        form.discount ||
        form.description.trim() ||
        form.image ||
        formImages.length > 0 ||
        formSpecTemplateId ||
        Object.keys(formSpecs).length > 0 ||
        !form.inStock ||
        form.isNew ||
        form.isBestSeller,
    );

  useBeforeUnloadWarning(hasUnsavedFormChanges);

  useEffect(() => {
    if (!hydrated || restoredDraftRef.current) {
      return;
    }

    const draft = loadDraft<ProductDraft>(PRODUCT_DRAFT_KEY);
    restoredDraftRef.current = true;

    if (!draft?.showForm) {
      return;
    }

    setEditingProduct(
      draft.editingProductId
        ? products.find((item) => item.id === draft.editingProductId) ?? null
        : null,
    );
    setForm(draft.form);
    setFormImages(draft.formImages);
    setFormSpecTemplateId(draft.formSpecTemplateId);
    setFormSpecs(draft.formSpecs);
    setShowForm(true);
  }, [hydrated, products]);

  useEffect(() => {
    if (!showForm) {
      return;
    }

    saveDraft<ProductDraft>(PRODUCT_DRAFT_KEY, {
      showForm: true,
      editingProductId: editingProduct?.id ?? null,
      form,
      formImages,
      formSpecTemplateId,
      formSpecs,
    });
  }, [editingProduct?.id, form, formImages, formSpecTemplateId, formSpecs, showForm]);

  const brands = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach(p => { if (!map.has(p.brandId)) map.set(p.brandId, p.brandName); });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.brandName.toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === 'all' || p.categoryId === categoryFilter;
      const matchBrand = brandFilter === 'all' || p.brandId === brandFilter;
      const matchStock =
        stockFilter === 'all' ? true :
        stockFilter === 'in_stock' ? p.inStock :
        stockFilter === 'out_of_stock' ? !p.inStock :
        stockFilter === 'has_discount' ? !!p.discount :
        !p.discount;
      return matchSearch && matchCat && matchBrand && matchStock;
    });
  }, [products, search, categoryFilter, brandFilter, stockFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const safePage = Math.min(currentPage, totalPages || 1);
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginated.map(p => p.id)));
    }
  };

  const bulkSetStock = (inStock: boolean) => {
    selected.forEach(id => {
      const p = products.find(x => x.id === id);
      if (p) updateProduct({ ...p, inStock });
    });
    setSelected(new Set());
  };

  const bulkDelete = () => {
    selected.forEach(id => deleteProduct(id));
    setSelected(new Set());
  };

  const bulkApplyDiscount = (percent: number) => {
    selected.forEach(id => {
      const p = products.find(x => x.id === id);
      if (p) {
        const originalPrice = p.originalPrice || p.price;
        const discountedPrice = Math.round(originalPrice * (1 - percent / 100));
        updateProduct({ ...p, originalPrice, price: discountedPrice, discount: percent });
      }
    });
    setBulkDiscount('');
    setSelected(new Set());
  };

  const bulkRemoveDiscount = () => {
    selected.forEach(id => {
      const p = products.find(x => x.id === id);
      if (p && (p.discount || p.originalPrice)) {
        const realPrice = p.originalPrice || p.price;
        updateProduct({ ...p, price: realPrice, originalPrice: undefined, discount: undefined });
      }
    });
    setSelected(new Set());
  };

  const isAllSelected = paginated.length > 0 && selected.size === paginated.length;

  const currentTemplate = useMemo(() => {
    return specTemplates.find(t => t.id === formSpecTemplateId);
  }, [specTemplates, formSpecTemplateId]);

  const closeForm = () => {
    clearDraft(PRODUCT_DRAFT_KEY);
    setEditingProduct(null);
    setShowForm(false);
  };

  const openAdd = () => {
    setEditingProduct(null);
    setForm(INITIAL_PRODUCT_FORM);
    setFormImages([]);
    setFormSpecTemplateId('');
    setFormSpecs({});
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name, brandName: p.brandName, categoryId: p.categoryId,
      price: p.price.toString(), originalPrice: p.originalPrice?.toString() || '', discount: p.discount?.toString() || '',
      description: p.description || '', image: p.image, inStock: p.inStock, isNew: p.isNew, isBestSeller: p.isBestSeller,
    });
    setFormImages(p.images || (p.image && !p.image.startsWith('/products/') ? [p.image] : []));
    setFormSpecTemplateId(p.specTemplateId || '');
    setFormSpecs(p.specs ? { ...p.specs } : {});
    setShowForm(true);
  };

  const handleSpecChange = (label: string, value: string | number | boolean) => {
    setFormSpecs(prev => ({ ...prev, [label]: value }));
  };

  const handleSave = () => {
    const specs: Record<string, string | number | boolean> | undefined =
      formSpecTemplateId && Object.keys(formSpecs).length > 0 ? formSpecs : undefined;

    const now = new Date().toISOString();
    const product: Product = {
      id: editingProduct?.id || `prod-${Date.now()}`,
      name: form.name,
      brandId: editingProduct?.brandId || `brand-${Date.now()}`,
      brandName: form.brandName,
      categoryId: form.categoryId,
      categoryName: categories.find(c => c.id === form.categoryId)?.name || '',
      specTemplateId: formSpecTemplateId || undefined,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
      discount: form.discount ? Number(form.discount) : undefined,
      description: form.description,
      image: formImages[0] || form.image || '/products/placeholder.jpg',
      images: formImages.length > 0 ? formImages : undefined,
      specs,
      rating: editingProduct?.rating ?? 0,
      reviewCount: editingProduct?.reviewCount ?? 0,
      inStock: form.inStock,
      isNew: form.isNew,
      isBestSeller: form.isBestSeller,
      createdAt: editingProduct?.createdAt || now,
      updatedAt: now,
    };

    if (editingProduct) {
      updateProduct(product);
    } else {
      addProduct(product);
    }
    closeForm();
  };

  const viewTemplate = useMemo(() => {
    if (!viewProduct?.specTemplateId) return null;
    return specTemplates.find(t => t.id === viewProduct.specTemplateId);
  }, [viewProduct, specTemplates]);

  return (
    <>
      <div className="space-y-4 animate-fade-in">
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={openAdd}><Plus className="w-4 h-4" />إضافة منتج</Button>
          <div className="flex-1 min-w-[200px] max-w-sm">
            <SearchInput value={search} onChange={setSearch} placeholder="بحث بالاسم أو البراند..." />
          </div>
          <div className="relative">
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="appearance-none bg-bg-secondary border border-border rounded-xl px-4 py-2.5 pl-8 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors">
              <option value="all">جميع الأقسام</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
          <div className="relative">
            <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
              className="appearance-none bg-bg-secondary border border-border rounded-xl px-4 py-2.5 pl-8 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors">
              <option value="all">جميع البراندات</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
          <div className="relative">
            <select value={stockFilter} onChange={e => setStockFilter(e.target.value)}
              className="appearance-none bg-bg-secondary border border-border rounded-xl px-4 py-2.5 pl-8 text-sm text-text-primary focus:outline-none focus:border-accent transition-colors">
              <option value="all">الكل</option>
              <option value="in_stock">متوفر</option>
              <option value="out_of_stock">غير متوفر</option>
              <option value="has_discount">عليه خصم</option>
              <option value="no_discount">بدون خصم</option>
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
          <div className="flex bg-bg-secondary rounded-xl border border-border overflow-hidden">
            <button onClick={() => setViewMode('table')} className={`p-2 ${viewMode === 'table' ? 'bg-accent/10 text-accent' : 'text-text-muted'}`}><List className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-accent/10 text-accent' : 'text-text-muted'}`}><Grid3X3 className="w-4 h-4" /></button>
          </div>
          <span className="text-sm text-text-secondary">{filtered.length} منتج</span>
        </div>

        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-3 bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 animate-fade-in">
            <span className="text-sm text-accent font-medium">
              <CheckSquare className="w-4 h-4 inline ml-1" />
              {selected.size} منتج محدد
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => bulkSetStock(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-success/10 text-success hover:bg-success/20 transition-colors">
                <PackageCheck className="w-3.5 h-3.5" />تعيين متوفر
              </button>
              <button onClick={() => bulkSetStock(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-warning/10 text-warning hover:bg-warning/20 transition-colors">
                <PackageX className="w-3.5 h-3.5" />تعيين غير متوفر
              </button>
              <div className="flex items-center gap-1.5 bg-bg-secondary rounded-lg border border-border px-2 py-1">
                <Percent className="w-3.5 h-3.5 text-accent" />
                <input type="number" min="1" max="99" value={bulkDiscount} onChange={e => setBulkDiscount(e.target.value)}
                  placeholder="خصم %" className="w-14 bg-transparent text-xs text-text-primary placeholder:text-text-muted focus:outline-none font-inter" />
                <button onClick={() => { if (bulkDiscount && Number(bulkDiscount) > 0) bulkApplyDiscount(Number(bulkDiscount)); }}
                  disabled={!bulkDiscount || Number(bulkDiscount) <= 0}
                  className="px-2 py-0.5 rounded text-xs bg-accent text-white hover:bg-accent-hover transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                  تطبيق
                </button>
              </div>
              <button onClick={() => { if (confirm(`إلغاء الخصم عن ${selected.size} منتج؟`)) bulkRemoveDiscount(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors">
                <XCircle className="w-3.5 h-3.5" />إلغاء الخصم
              </button>
              <button onClick={() => { if (confirm(`حذف ${selected.size} منتج؟`)) bulkDelete(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-danger/10 text-danger hover:bg-danger/20 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />حذف الكل
              </button>
            </div>
            <button onClick={() => setSelected(new Set())} className="text-xs text-text-muted hover:text-text-secondary mr-auto">إلغاء التحديد</button>
          </div>
        )}

        {viewMode === 'table' ? (
        <div className="bg-bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary/30">
                    <th className="py-3 px-4 w-10">
                      <input type="checkbox" checked={isAllSelected} onChange={toggleAll} className="w-4 h-4 rounded accent-accent" />
                    </th>
                    <th className="text-right py-3 px-4 text-text-secondary font-medium">المنتج</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-medium">البراند</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-medium">القسم</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-medium">السعر</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-medium">الحالة</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map(p => (
                    <tr key={p.id} className={`border-b border-border/50 hover:bg-bg-secondary/30 transition-colors ${selected.has(p.id) ? 'bg-accent/5' : ''}`}>
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="w-4 h-4 rounded accent-accent" />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setViewProduct(p); setShowDetails(true); }}>
                          <div className="w-10 h-10 bg-bg-secondary rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                            {p.image && !p.image.startsWith('/products/') ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-text-muted text-xs">🏍</span>
                            )}
                          </div>
                          <div>
                            <p className="text-text-primary font-medium">{p.name}</p>
                            <div className="flex gap-1 mt-0.5">
                              {p.isNew && <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">جديد</span>}
                              {p.isBestSeller && <span className="text-[10px] bg-warning/10 text-warning px-1.5 py-0.5 rounded">الأكثر مبيعاً</span>}
                              {p.specs && <span className="text-[10px] bg-success/10 text-success px-1.5 py-0.5 rounded">+مواصفات</span>}
                              {!p.specs && p.specTemplateId && <span className="text-[10px] bg-warning/10 text-warning px-1.5 py-0.5 rounded">يحتاج مواصفات</span>}
                              {p.discount && <span className="text-[10px] bg-danger/10 text-danger px-1.5 py-0.5 rounded">خصم {p.discount}%</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text-secondary">{p.brandName}</td>
                      <td className="py-3 px-4 text-text-secondary">{p.categoryName}</td>
                      <td className="py-3 px-4">
                        <p className="text-text-primary font-inter">{formatIQD(p.price)}</p>
                        {p.originalPrice && <p className="text-xs text-text-muted line-through font-inter">{formatIQD(p.originalPrice)}</p>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${p.inStock ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                          {p.inStock ? 'متوفر' : 'غير متوفر'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setViewProduct(p); setShowDetails(true); }} className="p-1.5 rounded-lg text-text-muted hover:text-accent hover:bg-accent/10 transition-colors"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-text-muted hover:text-warning hover:bg-warning/10 transition-colors"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => { if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) deleteProduct(p.id); }} className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginated.map(p => (
              <div key={p.id} className={`bg-bg-card rounded-2xl border p-4 hover:border-bg-hover transition-all relative ${selected.has(p.id) ? 'border-accent/40 bg-accent/5' : 'border-border'}`}>
                <div className="absolute top-3 right-3 z-10" onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="w-4 h-4 rounded accent-accent" />
                </div>
                <div className="w-full h-32 bg-bg-secondary rounded-xl overflow-hidden flex items-center justify-center mb-3 cursor-pointer" onClick={() => { setViewProduct(p); setShowDetails(true); }}>
                  {p.image && !p.image.startsWith('/products/') ? (
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">🏍️</span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-text-primary mb-1 cursor-pointer" onClick={() => { setViewProduct(p); setShowDetails(true); }}>{p.name}</h3>
                <p className="text-xs text-text-secondary mb-2">{p.brandName} • {p.categoryName}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-accent font-inter">{formatIQD(p.price)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-lg ${p.inStock ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {p.inStock ? 'متوفر' : 'غير متوفر'}
                  </span>
                </div>
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(p)} className="flex-1"><Edit3 className="w-3 h-3" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm('حذف؟')) deleteProduct(p.id); }} className="flex-1 text-danger"><Trash2 className="w-3 h-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination currentPage={safePage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <Modal isOpen={showForm} onClose={closeForm} title={editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'} size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">اسم المنتج *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">البراند *</label>
              <input type="text" value={form.brandName} onChange={e => setForm({ ...form, brandName: e.target.value })}
                className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">القسم *</label>
              <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent">
                <option value="">اختر القسم</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">قالب المواصفات الفنية</label>
              <select value={formSpecTemplateId} onChange={e => { setFormSpecTemplateId(e.target.value); setFormSpecs({}); }}
                className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent">
                <option value="">بدون مواصفات</option>
                {specTemplates.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">السعر *</label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">السعر الأصلي</label>
              <input type="number" value={form.originalPrice} onChange={e => setForm({ ...form, originalPrice: e.target.value })}
                className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">نسبة الخصم %</label>
              <input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })}
                className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-text-secondary mb-1">صور المنتج</label>
              <MultiImageUpload
                value={formImages}
                onChange={setFormImages}
                max={8}
                hints={productImageHints}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-text-secondary mb-1">الوصف</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent resize-none" />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.inStock} onChange={e => setForm({ ...form, inStock: e.target.checked })} className="w-4 h-4 rounded accent-accent" />
              <span className="text-sm text-text-primary">متوفر</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isNew} onChange={e => setForm({ ...form, isNew: e.target.checked })} className="w-4 h-4 rounded accent-accent" />
              <span className="text-sm text-text-primary">جديد</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isBestSeller} onChange={e => setForm({ ...form, isBestSeller: e.target.checked })} className="w-4 h-4 rounded accent-accent" />
              <span className="text-sm text-text-primary">الأكثر مبيعاً</span>
            </label>
          </div>

          {currentTemplate && (
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-text-primary">
                  {currentTemplate.icon} مواصفات {currentTemplate.name}
                </h4>
                <span className="text-xs text-text-muted">{currentTemplate.fields.length} حقل</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {currentTemplate.fields.map(field => (
                  <div key={field.id}>
                    <label className="block text-xs text-text-muted mb-1">
                      {field.label} {field.unit && <span className="text-text-muted/60">({field.unit})</span>}
                    </label>
                    {field.type === 'boolean' ? (
                      <label className="flex items-center gap-2 px-2.5 py-2 bg-bg-secondary border border-border rounded-lg cursor-pointer">
                        <input type="checkbox"
                          checked={!!formSpecs[field.label]}
                          onChange={e => handleSpecChange(field.label, e.target.checked)}
                          className="w-4 h-4 accent-accent" />
                        <span className="text-xs text-text-primary">{formSpecs[field.label] ? 'نعم' : 'لا'}</span>
                      </label>
                    ) : field.type === 'select' && field.options ? (
                      <select value={(formSpecs[field.label] as string) || ''} onChange={e => handleSpecChange(field.label, e.target.value)}
                        className="w-full bg-bg-secondary border border-border rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-accent">
                        <option value="">اختر</option>
                        {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={(formSpecs[field.label] as string | number) ?? (field.type === 'number' ? '' : '')}
                        onChange={e => handleSpecChange(field.label, field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                        className="w-full bg-bg-secondary border border-border rounded-lg px-2.5 py-2 text-xs text-text-primary focus:outline-none focus:border-accent"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={!form.name || !form.price || !form.categoryId}>
              {editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}
            </Button>
            <Button variant="secondary" onClick={closeForm}>إلغاء</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDetails} onClose={() => { setShowDetails(false); setViewImageIdx(0); }} title={viewProduct?.name || ''} size="lg">
        {viewProduct && (
          <div className="space-y-4">
            {(() => {
              const allImages = viewProduct.images && viewProduct.images.length > 0
                ? viewProduct.images
                : (viewProduct.image && !viewProduct.image.startsWith('/products/') ? [viewProduct.image] : []);
              if (allImages.length === 0) return null;
              const safeIdx = Math.min(viewImageIdx, allImages.length - 1);
              return (
                <div className="space-y-2">
                  <div className="relative w-full h-56 rounded-xl overflow-hidden bg-bg-secondary">
                    <img src={allImages[safeIdx]} alt={viewProduct.name} className="w-full h-full object-cover transition-all duration-300" />
                    {allImages.length > 1 && (
                      <>
                        <button
                          onClick={() => setViewImageIdx(i => i > 0 ? i - 1 : allImages.length - 1)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewImageIdx(i => i < allImages.length - 1 ? i + 1 : 0)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {allImages.map((_, i) => (
                            <button key={i} onClick={() => setViewImageIdx(i)}
                              className={`w-2 h-2 rounded-full transition-all ${i === safeIdx ? 'bg-accent w-5' : 'bg-white/50 hover:bg-white/80'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  {allImages.length > 1 && (
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {allImages.map((img, i) => (
                        <button key={i} onClick={() => setViewImageIdx(i)}
                          className={`shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === safeIdx ? 'border-accent' : 'border-border opacity-60 hover:opacity-100'}`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-bg-secondary rounded-xl p-3"><p className="text-xs text-text-muted">البراند</p><p className="text-sm text-text-primary">{viewProduct.brandName}</p></div>
              <div className="bg-bg-secondary rounded-xl p-3"><p className="text-xs text-text-muted">القسم</p><p className="text-sm text-text-primary">{viewProduct.categoryName}</p></div>
              <div className="bg-bg-secondary rounded-xl p-3"><p className="text-xs text-text-muted">السعر</p><p className="text-sm text-text-primary font-inter">{formatIQD(viewProduct.price)}</p></div>
              <div className="bg-bg-secondary rounded-xl p-3"><p className="text-xs text-text-muted">الحالة</p><p className="text-sm text-text-primary">{viewProduct.inStock ? 'متوفر' : 'غير متوفر'}</p></div>
            </div>
            {viewProduct.description && <p className="text-sm text-text-secondary">{viewProduct.description}</p>}
            {viewProduct.specs && viewTemplate && (
              <div>
                <h4 className="text-sm font-semibold text-text-primary mb-2">{viewTemplate.icon} المواصفات الفنية</h4>
                <div className="bg-bg-secondary rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {viewTemplate.fields.map(field => {
                        const val = viewProduct.specs![field.label];
                        if (val === undefined || val === null || val === '') return null;
                        const displayVal = typeof val === 'boolean'
                          ? (val ? 'نعم' : 'لا')
                          : `${val}${field.unit ? ` ${field.unit}` : ''}`;
                        return (
                          <tr key={field.id} className="border-b border-border/50 last:border-0">
                            <td className="py-2 px-3 text-text-secondary">{field.label}</td>
                            <td className="py-2 px-3 text-text-primary font-inter">{displayVal}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {!viewProduct.specs && viewProduct.specTemplateId && (
              <div className="bg-warning/10 border border-warning/20 rounded-xl px-4 py-3">
                <p className="text-sm text-warning">هذا المنتج لديه قالب مواصفات لكن لم تُملأ الحقول بعد</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
