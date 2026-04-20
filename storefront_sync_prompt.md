# بروميت توحيد الموقع الرئيسي مع لوحة التحكم - MotoMall

## السياق العام

أنا أعمل على مشروع MotoMall — منصة إلكترونية لبيع الدراجات النارية والكهربائية في العراق. المشروع مقسم إلى:

1. **لوحة التحكم (Admin Dashboard)** — المسار: `D:\1 Projects\Motomall opus 4.6 Control` — Next.js 16 + TypeScript
2. **الموقع الرئيسي (Storefront)** — المسار: `D:\1 Projects\Motomall opus 4.6` — Next.js 15 + TypeScript

---

## ما تم إنجازه في لوحة التحكم (لا تعدل عليه)

لوحة التحكم الآن تحتوي على:

### صفحات إدارية جاهزة:
- `/dashboard/products` — إدارة المنتجات (CRUD) مع حقول: `brandId`, `brandName`, `categoryId`, `categoryName`, `rating`, `reviewCount`, `images[]`, `specTemplateId`, `specs`
- `/dashboard/categories` — إدارة الأقسام مع **أقسام فرعية (subcategories)** — إضافة/حذف tags
- `/dashboard/brands` — إدارة البراندات (CRUD) مع: `slug`, `logo`, `country`, `isActive`
- `/dashboard/banners` — إدارة بانرات الصفحة الرئيسية مع: `title`, `subtitle`, `buttonText`, `buttonHref`, `gradient`, `icon`, `size` (large/small), `sortOrder`, `isActive`
- `/dashboard/orders` — عرض وإدارة الطلبات مع `timeline` (TrackingEvent[])
- `/dashboard/reviews` — إدارة التقييمات (pending/approved/rejected)
- `/dashboard/customers` — إدارة العملاء
- `/dashboard/specs` — قوالب المواصفات الفنية (SpecTemplate)
- `/dashboard/comparisons` — المقارنات
- `/dashboard/settings` — الإعدادات الشاملة:
  - معلومات المتجر (storeName, storeDescription, currency)
  - معلومات الاتصال (storePhone, storeEmail, storeAddress)
  - روابط السوشيال ميديا (SocialLink[]) — Facebook, Instagram, WhatsApp, YouTube, TikTok, X, Telegram — مع تشغيل/إيقاف لكل رابط
  - شريط الثقة (TrustFeature[]) — العناصر التي تظهر أسفل البانرات مع أيقونات قابلة للتخصيص
  - الفوتر (footerCopyright)
  - الشحن (shippingProvinces)
  - وسائل الدفع (paymentMethods)
  - السياسات (returnPolicy, termsConditions, privacyPolicy)
  - SEO (seoTitle, seoDescription, seoKeywords)

### أنواع البيانات الموحدة (admin.ts):
```typescript
// المنتج — الحقول الأساسية التي يرسلها الأدمن
Product {
  id, name, nameEn?, slug?, brandId, brandName, categoryId, categoryName,
  vehicleType?, price, originalPrice?, discount?, image, images?,
  description?, specTemplateId?, specs?: Record<string, string|number|boolean>,
  rating, reviewCount, inStock, isNew, isBestSeller, createdAt, updatedAt
}

// القسم
Category { id, name, slug, description?, image?, icon?, parentId?, subcategories?: Subcategory[], productCount, isActive }
Subcategory { id, name, slug, productCount? }

// البراند
Brand { id, name, slug, logo?, country?, isActive }

// بانر الواجهة
HeroBanner { id, title, subtitle, buttonText, buttonHref, image?, gradient?, icon?, size: 'large'|'small', sortOrder, isActive }

// شريط الثقة
TrustFeature { id, icon, title, description, sortOrder }

// السوشيال
SocialLink { id, platform: 'facebook'|'instagram'|'x'|'youtube'|'whatsapp'|'telegram'|'tiktok', url, isActive }

// الطلب
Order { id, orderNumber, customerId, customerName, customerPhone, customerEmail?,
  items: OrderItem[], totalAmount, status, paymentMethod, shippingAddress,
  trackingCode?, timeline?: TrackingEvent[], notes?, createdAt, updatedAt }

OrderItem { productId, productName, productImage?, quantity, price }
TrackingEvent { id, title, description, timestamp, completed }

// التقييم
Review { id, productId, productName, customerId, customerName, rating, comment, status: 'pending'|'approved'|'rejected', createdAt }

// الإعدادات
SiteSettings {
  storeName, storeDescription, storeLogo?, storePhone?, storeEmail?, storeAddress?,
  shippingProvinces: {name, price}[], paymentMethods: {id, name, isActive}[],
  currency, returnPolicy, termsConditions, privacyPolicy,
  seoTitle, seoDescription, seoKeywords,
  socialLinks: SocialLink[], trustFeatures: TrustFeature[], footerCopyright?
}
```

---

## المطلوب: تحديث الموقع الرئيسي

### الملفات التي تحتاج تعديل:

---

### 1. `src/types/index.ts` — ✅ تم تحديثه بالفعل
الأنواع الآن موحدة. **لا يحتاج تعديل إضافي** إلا إذا أضفت حقول جديدة.

---

### 2. `src/components/home/TrustBar.tsx` — ⚠️ يحتاج تعديل (هام)
**الحالة الحالية:** البيانات مكتوبة hardcoded داخل المكون.
**المطلوب:** يجب أن يقرأ من Firebase/Firestore مجموعة `siteSettings.trustFeatures` أو من mock data.

**الخطوات:**
- أنشئ دالة `getCatalogSiteSettings()` في `src/lib/firebase/catalog.ts` التي تقرأ `siteSettings` من Firestore
- أو أنشئ ملف خدمة منفصل `src/lib/firebase/settings.ts`
- حوّل `TrustBar` إلى **server component** (أزل `'use client'`) ليقرأ السيتينغز
- استخدم الأيقونات ديناميكياً بناءً على `feature.icon` (القيم الممكنة: `truck`, `shield-check`, `credit-card`, `rotate-ccw`, `headphones`, `award`, `package`, `clock`)
- Fallback: إذا لم تتوفر بيانات من Firebase، استخدم البيانات الحالية كقيم افتراضية

---

### 3. `src/components/layout/Footer.tsx` — ⚠️ يحتاج تعديل (هام)
**الحالة الحالية:** روابط السوشيال ميديا وحقوق النشر مكتوبة hardcoded.
**المطلوب:**
- قراءة `socialLinks` من SiteSettings — عرض فقط الروابط التي `isActive === true`
- قراءة `footerCopyright` من SiteSettings بدلاً من النص الثابت `"© 2025 MotoMall"`
- قراءة `storePhone` لرابط الهاتف في خدمة العملاء
- حوّل Footer إلى server component لقراءة البيانات

---

### 4. `src/components/layout/TopBar.tsx` — ⚠️ يحتاج تعديل
**الحالة الحالية:** رقم الهاتف مكتوب hardcoded.
**المطلوب:**
- قراءة `storePhone` من SiteSettings ديناميكياً

---

### 5. `src/components/home/BrandShowcase.tsx` — ✅ يعمل بشكل صحيح
يستخدم `getCatalogBrands()` بالفعل. **لا يحتاج تعديل**.

---

### 6. `src/components/home/HeroGrid.tsx` — ✅ تم تحديثه بالفعل
يستخدم `getCatalogHeroBanners()`. **لا يحتاج تعديل**.

---

### 7. `src/lib/categories.ts` — ⚠️ يحتاج تعديل (هام)
**الحالة الحالية:** `categoryInfo` و `subcategoryInfo` مكتوبة hardcoded كـ objects ثابتة.
**المشكلة:** عندما يعدل الأدمن الأقسام والأقسام الفرعية من لوحة التحكم، لن يتغير شيء في الموقع لأن البيانات ثابتة.
**المطلوب:**
- استخدام `getCatalogCategories()` بدلاً من الكائنات الثابتة
- الأقسام الفرعية الآن تأتي كجزء من الـ Category: `category.subcategories: Subcategory[]`
- تحديث `isValidCategory()` و `isValidSubcategory()` للقراءة من البيانات الديناميكية
- يمكن الاحتفاظ بالبيانات الثابتة كـ fallback فقط

---

### 8. خدمة Firebase جديدة مطلوبة — `getCatalogSiteSettings()`
**أضف** في `src/lib/firebase/catalog.ts` أو أنشئ `src/lib/firebase/settings.ts`:
```typescript
export async function getCatalogSiteSettings(): Promise<SiteSettings> {
  const db = getFirebaseAdminDb();
  if (!db) return defaultSettings; // fallback

  try {
    const doc = await db.collection('config').doc('siteSettings').get();
    if (!doc.exists) return defaultSettings;
    return doc.data() as SiteSettings;
  } catch {
    return defaultSettings;
  }
}
```

القيم الافتراضية (`defaultSettings`) يجب أن تحتوي على:
```typescript
const defaultSettings: SiteSettings = {
  storeName: 'MotoMall',
  storeDescription: 'وجهتك الأولى في العراق...',
  storePhone: '+964 770 123 4567',
  storeEmail: 'info@motomall.iq',
  storeAddress: 'بغداد، العراق',
  socialLinks: [
    { id: 'fb', platform: 'facebook', url: '#', isActive: true },
    { id: 'ig', platform: 'instagram', url: '#', isActive: true },
    { id: 'wa', platform: 'whatsapp', url: 'https://wa.me/9647701234567', isActive: true },
    { id: 'yt', platform: 'youtube', url: '#', isActive: true },
    { id: 'x', platform: 'x', url: '#', isActive: true },
  ],
  trustFeatures: [
    { id: 't1', icon: 'truck', title: 'توصيل سريع', description: 'لجميع محافظات العراق', sortOrder: 1 },
    { id: 't2', icon: 'shield-check', title: 'ضمان الجودة', description: 'منتجات أصلية 100%', sortOrder: 2 },
    { id: 't3', icon: 'credit-card', title: 'دفع آمن', description: 'طرق دفع متعددة ومؤمنة', sortOrder: 3 },
    { id: 't4', icon: 'rotate-ccw', title: 'إرجاع سهل', description: 'سياسة إرجاع مرنة خلال 14 يوم', sortOrder: 4 },
  ],
  footerCopyright: '© 2025 MotoMall. جميع الحقوق محفوظة.',
};
```

---

### 9. `src/lib/site.ts` — يحتاج تعديل بسيط
**المطلوب:** قراءة `seoTitle`, `seoDescription`, `seoKeywords` من SiteSettings بدلاً من الثوابت الحالية في `siteConfig`.

---

### 10. عمل `npm run build` للتأكد
بعد جميع التعديلات، نفذ:
```bash
npm run build
```
وتأكد من:
- 0 أخطاء TypeScript
- جميع الصفحات تُبنى بنجاح
- لا يوجد import لنوع غير موجود

---

## قواعد Firebase المشتركة (Firestore Collections)

عندما يتم ربط كلا المشروعين بنفس Firebase، ستكون المجموعات كالتالي:

| Collection | يكتب فيها | يقرأ منها | الوصف |
|---|---|---|---|
| `products` | Admin | Storefront | المنتجات |
| `categories` | Admin | Storefront | الأقسام + subcategories |
| `brands` | Admin | Storefront | البراندات |
| `heroBanners` | Admin | Storefront | بانرات الواجهة |
| `orders` | Storefront | Admin + Storefront | الطلبات (العميل ينشئ، الأدمن يدير) |
| `reviews` | Storefront | Admin + Storefront | التقييمات (العميل يضيف، الأدمن يوافق) |
| `customers` | Storefront | Admin | بيانات العملاء |
| `config/siteSettings` | Admin | Storefront | إعدادات الموقع الشاملة |
| `specTemplates` | Admin | Storefront | قوالب المواصفات الفنية |
| `comparisons` | Admin | Storefront | المقارنات المميزة |

---

## ملاحظات حرجة

1. **التوافق العكسي**: يجب الحفاظ على حقول `brand` و `category` (الحقول القديمة) إلى جانب `brandName` و `categoryName` (الجديدة). كل مكان يستخدم `product.brand` يجب أن يستخدم `product.brandName || product.brand` — **تم تعديل أغلب المكونات بالفعل** لكن تحقق من أي مكون آخر.

2. **Firebase Config**: الموقع الرئيسي جاهز لقراءة Firebase عبر:
   - `src/lib/firebase/config.ts` — يقرأ من `.env.local`
   - `src/lib/firebase/admin.ts` — Firebase Admin SDK (server-side)
   - `src/lib/firebase/client.ts` — Firebase Client SDK (client-side)
   - `src/lib/firebase/catalog.ts` — خدمات القراءة (products, categories, brands, heroBanners) — **جاهز**

3. **لا تغير أسماء الصفحات أو المسارات**: هيكل الصفحات يجب أن يبقى كما هو.

4. **اللغة**: الموقع بالكامل بالعربية مع اتجاه RTL. احتفظ بنفس الأسلوب.

5. **التصميم**: لا تغير التصميم الحالي، فقط اجعل البيانات ديناميكية بدلاً من ثابتة.

---

## ملخص التغييرات المطلوبة (Checklist)

- [ ] إضافة `getCatalogSiteSettings()` في خدمات Firebase
- [ ] تحديث `TrustBar.tsx` — قراءة ديناميكية من Settings
- [ ] تحديث `Footer.tsx` — socialLinks + footerCopyright ديناميكية
- [ ] تحديث `TopBar.tsx` — storePhone ديناميكي
- [ ] تحديث `lib/categories.ts` — دعم الأقسام الديناميكية مع fallback
- [ ] تحديث `lib/site.ts` — SEO من Settings
- [ ] التحقق من أن جميع المكونات تستخدم `brandName || brand` و `categoryName || category`
- [ ] `npm run build` بنجاح — 0 أخطاء
