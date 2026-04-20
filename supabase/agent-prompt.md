# مهمة: هجرة MotoMall من Firebase إلى Supabase

أنت مسؤول عن هجرة مشروعي MotoMall من Firebase إلى Supabase بشكل كامل. المشروعان:

1. **Storefront**: `D:\1 Projects\Motomall opus 4.6` — Next.js 15 (متجر)
2. **Admin**: `D:\1 Projects\Motomall opus 4.6 Control` — Next.js 16 (لوحة التحكم)

ملف الخطة الكامل موجود في: `D:\1 Projects\Motomall opus 4.6 Control\supabase_migration_plan.md`
اقرأه أولاً قبل أي شيء — فيه المخطط الكامل للـ SQL والـ RLS وخرائط الأسماء.

## السياق الحرج

- Firebase غير مدفوع ولا يعمل على بلدي. نتحول إلى Supabase كبديل كامل.
- المشروعان يتشاركان نفس قاعدة البيانات.
- الموقع عربي RTL — لا تغير التصميم أو النصوص.
- TypeScript types في `src/types/index.ts` (storefront) و `src/types/admin.ts` (admin) **يجب أن تبقى كما هي** — فقط layer الـ DAL يتغير.

## قيود

- **لا تلمس التصميم أو CSS** — مهمتك data layer فقط.
- **لا تكسر أي TypeScript type** — لو احتجت تعديل type أضف حقولاً ولا تحذف.
- **لا تترك mixed imports** — بعد الانتهاء يجب ألا يبقى أي `import from '@/lib/firebase/...'` أو `from 'firebase/...'`.
- **استخدم `snake_case` في Supabase و camelCase في TypeScript** — اعمل mapping واضح.
- **RLS مُفعّل** — تأكد من أن الـ DAL يستخدم الـ client المناسب (anon للقراءة العامة، authenticated للمستخدم، service-role لقراءات server-side server-only).
- **لا تنسى `server-only`** في الملفات التي تستخدم service-role key.

## خطوات التنفيذ

نفّذها بالترتيب. لا تنتقل لخطوة إلا بعد التأكد من السابقة.

### 0) فحص ومسح
اقرأ:
- `D:\1 Projects\Motomall opus 4.6 Control\supabase_migration_plan.md` (كل الخطة)
- `src/types/index.ts` في الـ storefront
- `src/types/admin.ts` في الـ admin
- `src/lib/firebase/*.ts` في كلا المشروعين
- `src/lib/admin-store.tsx` في الـ admin
- `src/providers/CatalogProvider.tsx` و `src/providers/SiteSettingsProvider.tsx` في الـ storefront
- `src/components/account/AuthProvider.tsx` في الـ storefront
- `src/lib/orders.ts` في الـ storefront

### 1) تثبيت الحزم
في كلا المشروعين:
