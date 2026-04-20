'use client';

import { useState } from 'react';
import { useAdminStore } from '@/lib/admin-store';
import { SiteSettings, SocialLink, TrustFeature } from '@/types/admin';
import Button from '@/components/ui/Button';
import ImageUpload from '@/components/ui/ImageUpload';
import { Save, Store, Truck, CreditCard, FileText, Globe, Phone, Share2, ShieldCheck, MessageCircle, Trash2 } from 'lucide-react';

const platformLabels: Record<SocialLink['platform'], string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  x: 'X (Twitter)',
  youtube: 'YouTube',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  tiktok: 'TikTok',
};

const platformEmojis: Record<SocialLink['platform'], string> = {
  facebook: '📘',
  instagram: '📸',
  x: '🐦',
  youtube: '📺',
  whatsapp: '💬',
  telegram: '✈️',
  tiktok: '🎵',
};

const trustIconOptions = ['truck', 'shield-check', 'credit-card', 'rotate-ccw', 'headphones', 'award', 'package', 'clock'];
const trustIconLabels: Record<string, string> = {
  'truck': '🚚 توصيل',
  'shield-check': '🛡️ حماية',
  'credit-card': '💳 دفع',
  'rotate-ccw': '🔄 إرجاع',
  'headphones': '🎧 دعم',
  'award': '🏆 جودة',
  'package': '📦 تغليف',
  'clock': '⏰ سرعة',
};

const storeLogoHints = [
  'الأفضل: 800x240 بكسل للشعار الأفقي.',
  'النسبة الموصى بها: 10:3 أو أي مقاس أفقي قريب منها.',
  'يفضل PNG أو SVG بخلفية شفافة حتى يظهر الشعار بوضوح فوق الخلفيات المختلفة.',
];

export default function SettingsPage() {
  const { settings, updateSettings } = useAdminStore();
  const [form, setForm] = useState<SiteSettings>({ ...settings });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateProvince = (index: number, field: 'name' | 'price', value: string | number) => {
    const updated = [...form.shippingProvinces];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, shippingProvinces: updated });
  };

  const addProvince = () => {
    setForm({ ...form, shippingProvinces: [...form.shippingProvinces, { name: '', price: 0 }] });
  };

  const removeProvince = (index: number) => {
    setForm({ ...form, shippingProvinces: form.shippingProvinces.filter((_, i) => i !== index) });
  };

  const togglePayment = (id: string) => {
    setForm({
      ...form,
      paymentMethods: form.paymentMethods.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p),
    });
  };

  // Social Links
  const updateSocialLink = (id: string, field: keyof SocialLink, value: string | boolean) => {
    setForm({
      ...form,
      socialLinks: form.socialLinks.map(s => s.id === id ? { ...s, [field]: value } : s),
    });
  };

  const toggleSocialLink = (id: string) => {
    setForm({
      ...form,
      socialLinks: form.socialLinks.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s),
    });
  };

  // Trust Features
  const updateTrustFeature = (id: string, field: keyof TrustFeature, value: string | number) => {
    setForm({
      ...form,
      trustFeatures: form.trustFeatures.map(t => t.id === id ? { ...t, [field]: value } : t),
    });
  };

  const addTrustFeature = () => {
    const newFeature: TrustFeature = {
      id: `trust-${Date.now()}`,
      icon: 'truck',
      title: '',
      description: '',
      sortOrder: form.trustFeatures.length + 1,
    };
    setForm({ ...form, trustFeatures: [...form.trustFeatures, newFeature] });
  };

  const removeTrustFeature = (id: string) => {
    setForm({ ...form, trustFeatures: form.trustFeatures.filter(t => t.id !== id) });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">إعدادات الموقع</h3>
        <Button onClick={handleSave}>
          <Save className="w-4 h-4" />
          {saved ? 'تم الحفظ!' : 'حفظ التغييرات'}
        </Button>
      </div>

      {/* Store Info */}
      <div className="bg-bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Store className="w-5 h-5 text-accent" />
          <h4 className="text-base font-semibold text-text-primary">معلومات المتجر</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">اسم المتجر</label>
            <input type="text" value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">العملة</label>
            <input type="text" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent font-inter" dir="ltr" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-text-secondary mb-1">شعار المتجر</label>
            <ImageUpload
              value={form.storeLogo || ''}
              onChange={(storeLogo) => setForm({ ...form, storeLogo })}
              hints={storeLogoHints}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-text-secondary mb-1">وصف المتجر</label>
            <textarea value={form.storeDescription} onChange={e => setForm({ ...form, storeDescription: e.target.value })} rows={2}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent resize-none" />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="bg-bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Phone className="w-5 h-5 text-accent" />
          <h4 className="text-base font-semibold text-text-primary">معلومات الاتصال</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">رقم الهاتف</label>
            <input type="text" value={form.storePhone || ''} onChange={e => setForm({ ...form, storePhone: e.target.value })}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent font-inter" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">البريد الإلكتروني</label>
            <input type="email" value={form.storeEmail || ''} onChange={e => setForm({ ...form, storeEmail: e.target.value })}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent font-inter" dir="ltr" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-text-secondary mb-1">العنوان</label>
            <input type="text" value={form.storeAddress || ''} onChange={e => setForm({ ...form, storeAddress: e.target.value })}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent" />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-5 h-5 text-accent" />
          <h4 className="text-base font-semibold text-text-primary">روابط التواصل الاجتماعي</h4>
        </div>
        <div className="space-y-2">
          {form.socialLinks.map(link => (
            <div key={link.id} className="flex items-center gap-3 bg-bg-secondary/50 rounded-xl p-3">
              <span className="text-lg shrink-0">{platformEmojis[link.platform]}</span>
              <span className="text-sm text-text-secondary w-20 shrink-0">{platformLabels[link.platform]}</span>
              <input type="url" value={link.url} onChange={e => updateSocialLink(link.id, 'url', e.target.value)}
                className="flex-1 bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-accent font-inter text-left" dir="ltr"
                placeholder="https://..." />
              <button
                onClick={() => toggleSocialLink(link.id)}
                className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${link.isActive ? 'bg-success' : 'bg-bg-hover'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${link.isActive ? 'left-0.5' : 'left-[22px]'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Features */}
      <div className="bg-bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <h4 className="text-base font-semibold text-text-primary">شريط الثقة (Trust Bar)</h4>
          </div>
          <Button size="sm" variant="secondary" onClick={addTrustFeature}>+ إضافة</Button>
        </div>
        <p className="text-xs text-text-muted mb-3">هذه الميزات تظهر أسفل البانرات في الصفحة الرئيسية للموقع</p>
        <div className="space-y-3">
          {form.trustFeatures.map(feature => (
            <div key={feature.id} className="bg-bg-secondary/50 rounded-xl p-3 space-y-2">
              <div className="flex items-center gap-3">
                <select value={feature.icon} onChange={e => updateTrustFeature(feature.id, 'icon', e.target.value)}
                  className="bg-bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary focus:outline-none">
                  {trustIconOptions.map(opt => (
                    <option key={opt} value={opt}>{trustIconLabels[opt] || opt}</option>
                  ))}
                </select>
                <input type="text" value={feature.title} onChange={e => updateTrustFeature(feature.id, 'title', e.target.value)}
                  className="flex-1 bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none" placeholder="العنوان" />
                <button onClick={() => removeTrustFeature(feature.id)} className="p-1 text-text-muted hover:text-danger transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <input type="text" value={feature.description} onChange={e => updateTrustFeature(feature.id, 'description', e.target.value)}
                className="w-full bg-bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none" placeholder="الوصف" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-5 h-5 text-accent" />
          <h4 className="text-base font-semibold text-text-primary">الفوتر</h4>
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">نص حقوق النشر</label>
          <input type="text" value={form.footerCopyright || ''} onChange={e => setForm({ ...form, footerCopyright: e.target.value })}
            className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent" />
        </div>
      </div>

      {/* Shipping */}
      <div className="bg-bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-accent" />
            <h4 className="text-base font-semibold text-text-primary">الشحن</h4>
          </div>
          <Button size="sm" variant="secondary" onClick={addProvince}>+ إضافة محافظة</Button>
        </div>
        <div className="space-y-2">
          {form.shippingProvinces.map((prov, i) => (
            <div key={i} className="flex items-center gap-3 bg-bg-secondary/50 rounded-xl p-2">
              <input type="text" value={prov.name} onChange={e => updateProvince(i, 'name', e.target.value)}
                className="flex-1 bg-transparent text-sm text-text-primary focus:outline-none" placeholder="اسم المحافظة" />
              <input type="number" value={prov.price} onChange={e => updateProvince(i, 'price', Number(e.target.value))}
                className="w-28 bg-bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-text-primary focus:outline-none font-inter" placeholder="السعر" />
              <button onClick={() => removeProvince(i)} className="text-text-muted hover:text-danger text-sm">حذف</button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-accent" />
          <h4 className="text-base font-semibold text-text-primary">وسائل الدفع</h4>
        </div>
        <div className="space-y-2">
          {form.paymentMethods.map(pm => (
            <label key={pm.id} className="flex items-center justify-between p-3 bg-bg-secondary/50 rounded-xl cursor-pointer">
              <span className="text-sm text-text-primary">{pm.name}</span>
              <button
                onClick={() => togglePayment(pm.id)}
                className={`w-10 h-5 rounded-full transition-colors relative ${pm.isActive ? 'bg-success' : 'bg-bg-hover'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${pm.isActive ? 'left-0.5' : 'left-[22px]'}`} />
              </button>
            </label>
          ))}
        </div>
      </div>

      {/* Policies */}
      <div className="bg-bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-accent" />
          <h4 className="text-base font-semibold text-text-primary">السياسات</h4>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">سياسة الإرجاع</label>
            <textarea value={form.returnPolicy} onChange={e => setForm({ ...form, returnPolicy: e.target.value })} rows={2}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent resize-none" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">الشروط والأحكام</label>
            <textarea value={form.termsConditions} onChange={e => setForm({ ...form, termsConditions: e.target.value })} rows={2}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent resize-none" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">سياسة الخصوصية</label>
            <textarea value={form.privacyPolicy} onChange={e => setForm({ ...form, privacyPolicy: e.target.value })} rows={2}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent resize-none" />
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-accent" />
          <h4 className="text-base font-semibold text-text-primary">SEO</h4>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-text-secondary mb-1">عنوان الصفحة</label>
            <input type="text" value={form.seoTitle} onChange={e => setForm({ ...form, seoTitle: e.target.value })}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">الوصف</label>
            <textarea value={form.seoDescription} onChange={e => setForm({ ...form, seoDescription: e.target.value })} rows={2}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent resize-none" />
          </div>
          <div>
            <label className="block text-sm text-text-secondary mb-1">الكلمات المفتاحية</label>
            <input type="text" value={form.seoKeywords} onChange={e => setForm({ ...form, seoKeywords: e.target.value })}
              className="w-full bg-bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-accent" />
          </div>
        </div>
      </div>

      <div className="flex justify-end pb-8">
        <Button onClick={handleSave}>
          <Save className="w-4 h-4" />
          {saved ? 'تم الحفظ!' : 'حفظ التغييرات'}
        </Button>
      </div>
    </div>
  );
}
