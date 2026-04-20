'use client';

import { useMemo, useState } from 'react';
import { useAdminStore } from '@/lib/admin-store';
import { HeroBanner } from '@/types/admin';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import ImageUpload from '@/components/ui/ImageUpload';
import {
  Edit3,
  Image as ImageIcon,
  Link2,
  MousePointerClick,
} from 'lucide-react';

const bannerIcons = ['⚡', '🏍️', '🔧', '🛵', '🪖', '🛡️', '🎯', '🔥', '💰', '🏎️', '🎨', '📦'];
const BANNER_PLACEHOLDER = '/placeholders/generic.svg';

function getEditableBannerImage(image?: string) {
  return image && image !== BANNER_PLACEHOLDER ? image : '';
}

function getBannerPositionMeta(index: number) {
  if (index === 0) {
    return {
      label: 'البانر الرئيسي',
      hint: 'يظهر كبيرًا في يمين الواجهة الرئيسية',
      size: 'large' as const,
    };
  }

  if (index === 1) {
    return {
      label: 'البانر الجانبي العلوي',
      hint: 'يظهر كبانر صغير أعلى يسار الواجهة الرئيسية',
      size: 'small' as const,
    };
  }

  return {
    label: 'البانر الجانبي السفلي',
    hint: 'يظهر كبانر صغير أسفل البانر الجانبي الآخر',
    size: 'small' as const,
  };
}

async function deleteUploadedUrl(url: string): Promise<void> {
  const response = await fetch('/api/upload', {
    method: 'DELETE',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error('delete failed');
  }
}

export default function BannersPage() {
  const { heroBanners, updateHeroBanner } = useAdminStore();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<HeroBanner | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [imageUploading, setImageUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    buttonText: '',
    buttonHref: '',
    image: '',
    gradient: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 40%, #E30613 100%)',
    icon: '⚡',
    size: 'small' as 'large' | 'small',
    isActive: true,
  });

  const sorted = useMemo(
    () => [...heroBanners].sort((a, b) => a.sortOrder - b.sortOrder),
    [heroBanners],
  );

  const protectedImageUrls =
    editing?.image && editing.image !== BANNER_PLACEHOLDER ? [editing.image] : [];

  const closeForm = (options?: { preserveCurrentImage?: boolean }) => {
    if (
      !options?.preserveCurrentImage &&
      form.image &&
      !protectedImageUrls.includes(form.image)
    ) {
      void deleteUploadedUrl(form.image).catch(() => undefined);
    }

    setShowForm(false);
    setEditing(null);
    setEditingIndex(-1);
    setImageUploading(false);
  };

  const openEdit = (banner: HeroBanner, index: number) => {
    const positionMeta = getBannerPositionMeta(index);

    setEditing(banner);
    setEditingIndex(index);
    setImageUploading(false);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle,
      buttonText: banner.buttonText,
      buttonHref: banner.buttonHref,
      image: getEditableBannerImage(banner.image),
      gradient: banner.gradient || '',
      icon: banner.icon || '⚡',
      size: positionMeta.size,
      isActive: banner.isActive,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (imageUploading || !editing) {
      return;
    }

    const positionMeta = getBannerPositionMeta(editingIndex >= 0 ? editingIndex : 0);

  const banner: HeroBanner = {
      id: editing.id,
      title: form.title,
      subtitle: form.subtitle,
      buttonText: form.buttonText,
      buttonHref: form.buttonHref,
      image: form.image || undefined,
      gradient: form.gradient,
      icon: form.icon,
      size: positionMeta.size,
      sortOrder: editing.sortOrder,
      isActive: form.isActive,
    };

    updateHeroBanner(banner);
    closeForm({ preserveCurrentImage: true });
  };

  const gradientPresets = [
    { label: 'أحمر', value: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a2e 40%, #E30613 100%)' },
    { label: 'أحمر داكن', value: 'linear-gradient(135deg, #1a1a1a 0%, #2d1f1f 60%, #8B0000 100%)' },
    { label: 'أخضر', value: 'linear-gradient(135deg, #111 0%, #1a2a1a 60%, #004d00 100%)' },
    { label: 'أزرق', value: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 60%, #0066cc 100%)' },
    { label: 'ذهبي', value: 'linear-gradient(135deg, #1a1a0a 0%, #2d2a1f 60%, #B8860B 100%)' },
  ];

  const bannerImageHints =
    form.size === 'large'
      ? [
          'الأفضل للبانر الكبير: 1600x800 بكسل.',
          'النسبة الموصى بها: 2:1 حتى تناسب واجهة الصفحة الرئيسية.',
          'يفضل ترك مساحة هادئة للنص في الجهة اليمنى السفلية وتجنب وضع العناصر المهمة قرب الأطراف.',
        ]
      : [
          'الأفضل للبانر الصغير: 1200x600 بكسل.',
          'النسبة الموصى بها: 2:1 حتى يبقى القص متناسقًا على الشاشات المختلفة.',
          'يفضل أن تكون الصورة أفقية وواضحة مع مساحة مناسبة للنص فوقها.',
        ];

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="rounded-[28px] border border-border bg-bg-card/60 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Hero Banners
              </p>
              <h2 className="text-2xl font-bold text-text-primary md:text-3xl">
                إدارة البانرات الثلاث الثابتة
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-text-secondary md:text-base">
                هذه الصفحة مخصصة فقط لتحرير البانر الرئيسي في يمين الواجهة والبانرين
                الصغيرين في الجهة اليسرى. لا توجد هنا إضافة أو حذف أو تبديل ترتيب.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-bg-secondary/70 px-5 py-4 text-center">
              <div className="text-3xl font-bold text-text-primary">{sorted.length}</div>
              <div className="text-xs text-text-muted">بانرات ثابتة في واجهة المتجر</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {sorted.map((banner, idx) => {
            const positionMeta = getBannerPositionMeta(idx);

            return (
              <div
                key={banner.id}
                className={`overflow-hidden rounded-[30px] border bg-bg-card/70 shadow-[0_20px_60px_rgba(0,0,0,0.18)] transition-all ${
                  banner.isActive ? 'border-border' : 'border-border/70 opacity-75'
                }`}
              >
                <div
                  className="relative min-h-[220px] overflow-hidden"
                  style={{ background: banner.gradient || '#1a1a1a' }}
                >
                  {banner.image ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-25"
                      style={{ backgroundImage: `url("${banner.image}")` }}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_34%),linear-gradient(90deg,rgba(10,12,21,0.38)_0%,rgba(10,12,21,0.12)_30%,rgba(10,12,21,0.18)_100%)]" />

                  <div className="relative z-10 grid gap-6 p-5 md:grid-cols-[92px_minmax(0,1fr)] md:p-7">
                    <div className="flex flex-row items-start gap-3 md:flex-col">
                      <div className="rounded-[24px] border border-white/10 bg-black/18 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/25 text-[30px] text-white/85">
                          {banner.icon || '⚡'}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => openEdit(banner, idx)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/12 text-white/85 transition-colors hover:bg-white/22"
                            aria-label="تعديل البانر"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-col justify-between gap-5 text-white">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/12 bg-black/18 px-3 py-1 text-xs font-semibold text-white/90">
                            {positionMeta.label}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              positionMeta.size === 'large'
                                ? 'bg-accent text-white'
                                : 'bg-white/18 text-white/90'
                            }`}
                          >
                            {positionMeta.size === 'large' ? 'بانر رئيسي' : 'بانر جانبي'}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              banner.isActive
                                ? 'bg-success/20 text-white'
                                : 'bg-danger/25 text-white'
                            }`}
                          >
                            {banner.isActive ? 'نشط' : 'معطل'}
                          </span>
                        </div>

                        {banner.image ? (
                          <span className="rounded-full border border-white/10 bg-black/18 px-3 py-1 text-xs text-white/85">
                            صورة مرفوعة ومتصلة
                          </span>
                        ) : (
                          <span className="rounded-full border border-white/10 bg-black/18 px-3 py-1 text-xs text-white/70">
                            بدون صورة مخصصة
                          </span>
                        )}
                      </div>

                      <div className="max-w-4xl space-y-3">
                        <h3 className="text-2xl font-bold leading-tight md:text-[2rem]">
                          {banner.title}
                        </h3>
                        <p className="max-w-3xl text-sm leading-7 text-white/80 md:text-base">
                          {banner.subtitle}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-[#111827]/78 px-4 py-3 backdrop-blur-sm">
                        <div className="flex flex-wrap items-center gap-3 text-sm text-white/88">
                          <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-2">
                            <MousePointerClick className="w-4 h-4" />
                            {banner.buttonText}
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-2 font-inter text-[13px]">
                            <Link2 className="w-4 h-4" />
                            {banner.buttonHref}
                          </span>
                        </div>

                        <div className="text-xs text-white/55">{positionMeta.hint}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {sorted.length === 0 ? (
            <div className="rounded-[28px] border border-border bg-bg-card px-6 py-14 text-center">
              <ImageIcon className="mx-auto mb-4 h-12 w-12 text-text-muted opacity-30" />
              <h3 className="text-xl font-bold text-text-primary">
                لم يتم العثور على البانرات الأساسية
              </h3>
              <p className="mt-2 text-sm leading-7 text-text-muted">
                هذه الصفحة تتوقع وجود ثلاث بانرات ثابتة فقط في البيانات المشتركة.
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <Modal isOpen={showForm} onClose={() => closeForm()} title="تعديل البانر" size="xl">
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.1fr)_380px]">
            <div className="space-y-5">
              <div className="rounded-[24px] border border-border bg-bg-secondary/35 p-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-text-primary">
                      العنوان الرئيسي
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, title: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-border bg-bg-secondary px-4 py-3 text-base text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-text-primary">
                      موضع البانر
                    </label>
                    <div className="rounded-2xl border border-border bg-bg-secondary px-4 py-3 text-base text-text-primary">
                      {editingIndex >= 0 ? getBannerPositionMeta(editingIndex).label : 'بانر ثابت'}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-text-primary">
                    العنوان الفرعي
                  </label>
                  <textarea
                    value={form.subtitle}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, subtitle: e.target.value }))
                    }
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-border bg-bg-secondary px-4 py-3 text-base leading-7 text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-[24px] border border-border bg-bg-secondary/35 p-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-text-primary">
                      نص الزر
                    </label>
                    <input
                      type="text"
                      value={form.buttonText}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, buttonText: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-border bg-bg-secondary px-4 py-3 text-base text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-text-primary">
                      رابط الزر
                    </label>
                    <input
                      type="text"
                      value={form.buttonHref}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, buttonHref: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-border bg-bg-secondary px-4 py-3 text-base text-text-primary focus:border-accent focus:outline-none font-inter"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-border bg-bg-secondary/35 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-text-primary">صورة البانر</h4>
                    <p className="mt-1 text-sm text-text-muted">
                      استخدم صورة واضحة ومناسبة لموضع هذا البانر في الواجهة.
                    </p>
                  </div>
                  <span className="rounded-full bg-bg-card px-3 py-1 text-xs text-text-muted">
                    {form.size === 'large' ? 'رئيسي' : 'جانبي'}
                  </span>
                </div>

                <div className="mt-4">
                  <ImageUpload
                    value={form.image}
                    onChange={(image) => setForm((current) => ({ ...current, image }))}
                    onUploadingChange={setImageUploading}
                    protectedUrls={protectedImageUrls}
                    hints={bannerImageHints}
                  />
                </div>

                {imageUploading ? (
                  <p className="mt-3 text-sm text-accent">يرجى انتظار اكتمال رفع الصورة قبل الحفظ.</p>
                ) : form.image ? (
                  <p className="mt-3 text-sm text-success">تم تجهيز صورة البانر وهي جاهزة للحفظ.</p>
                ) : (
                  <p className="mt-3 text-sm text-text-muted">لم يتم اختيار صورة لهذا البانر بعد.</p>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[24px] border border-border bg-bg-secondary/35 p-5">
                <h4 className="text-base font-semibold text-text-primary">الأيقونة</h4>
                <p className="mt-1 text-sm text-text-muted">
                  اختر رمزًا خفيفًا ينسجم مع نوع العرض.
                </p>
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {bannerIcons.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setForm((current) => ({ ...current, icon }))}
                      className={`flex h-14 items-center justify-center rounded-2xl border text-2xl transition-all ${
                        form.icon === icon
                          ? 'border-accent bg-accent/10 shadow-[0_0_0_1px_rgba(59,130,246,0.25)]'
                          : 'border-border bg-bg-secondary hover:border-accent/40 hover:bg-bg-card'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-border bg-bg-secondary/35 p-5">
                <h4 className="text-base font-semibold text-text-primary">لون التدرج</h4>
                <p className="mt-1 text-sm text-text-muted">
                  اختر الاتجاه البصري الأقرب لشكل البانر في الواجهة الرئيسية.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {gradientPresets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() =>
                        setForm((current) => ({ ...current, gradient: preset.value }))
                      }
                      className={`h-11 rounded-2xl border px-4 text-sm font-medium transition-all ${
                        form.gradient === preset.value
                          ? 'border-accent ring-1 ring-accent/30'
                          : 'border-border'
                      }`}
                      style={{ background: preset.value, color: '#fff' }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-border bg-bg-secondary/35 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-text-primary">المعاينة</h4>
                    <p className="mt-1 text-sm text-text-muted">
                      هذا شكل تقريبي للبطاقة بعد الحفظ.
                    </p>
                  </div>
                  <label className="flex items-center gap-2 rounded-full border border-border bg-bg-card px-3 py-2 text-sm text-text-primary">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) =>
                        setForm((current) => ({ ...current, isActive: e.target.checked }))
                      }
                      className="h-4 w-4 accent-accent"
                    />
                    نشط
                  </label>
                </div>

                <div
                  className="relative mt-4 min-h-[220px] overflow-hidden rounded-[28px] p-5"
                  style={{ background: form.gradient }}
                >
                  {form.image ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-30"
                      style={{ backgroundImage: `url("${form.image}")` }}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,10,20,0.14)_0%,rgba(7,10,20,0.55)_100%)]" />
                  <div className="relative z-10 flex h-full flex-col justify-between text-white">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/20 text-[32px]">
                        {form.icon}
                      </span>
                      <span className="rounded-full bg-black/20 px-3 py-1 text-xs">
                        {form.size === 'large' ? 'رئيسي' : 'جانبي'}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-2xl font-bold leading-tight">
                        {form.title || 'العنوان هنا'}
                      </h4>
                      <p className="text-sm leading-7 text-white/80">
                        {form.subtitle || 'العنوان الفرعي سيظهر هنا بصورة أوضح بعد الحفظ.'}
                      </p>
                      <div className="inline-flex items-center gap-2 rounded-full bg-black/20 px-4 py-2 text-sm">
                        <MousePointerClick className="w-4 h-4" />
                        {form.buttonText || 'نص الزر'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
            <Button variant="secondary" onClick={() => closeForm()} size="lg">
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={!form.title || imageUploading} size="lg">
              {imageUploading ? 'جاري رفع الصورة...' : 'حفظ التعديلات'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
