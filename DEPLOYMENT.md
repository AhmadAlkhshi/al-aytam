# دليل النشر — Deployment Guide
# نظام إدارة الطلاب — Student Management System

---

## المتطلبات الأساسية / Prerequisites

- حساب GitHub — [github.com](https://github.com)
- حساب Render (مجاني) — [render.com](https://render.com)
- حساب Vercel (مجاني) — [vercel.com](https://vercel.com)
- Git مثبّت على جهازك

---

## الخطوة 1 — رفع الكود على GitHub / Push Code to GitHub

```bash
# من مجلد المشروع الجذر
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

> **ملاحظة:** تأكد من أن ملفات `.env` و `.env.production` غير مرفوعة (مدرجة في .gitignore).

---

## الخطوة 2 — نشر الباكند على Render / Deploy Backend on Render

1. اذهب إلى [render.com](https://render.com) وسجّل الدخول.
2. من لوحة التحكم، اختر **New → Blueprint**.
3. اربط مستودع GitHub الخاص بك.
4. سيكتشف Render ملف `render.yaml` تلقائياً ويُنشئ:
   - **Web Service**: `student-management-backend`
   - **PostgreSQL Database**: `student-management-db`
5. انقر **Apply** لبدء عملية النشر.
6. انتظر حتى تكتمل عملية البناء (Build) والنشر.

---

## الخطوة 3 — تشغيل Migrations / Run Migrations

بعد نجاح النشر:

1. اذهب إلى لوحة تحكم الـ Web Service في Render.
2. اختر تبويب **Shell**.
3. شغّل الأمر التالي:

```bash
npm run migration:run
```

هذا سيُنشئ جداول قاعدة البيانات.

---

## الخطوة 4 — إنشاء مستخدم المشرف / Seed Admin User

في نفس Shell في Render:

```bash
npm run seed:admin
```

سيُنشئ هذا مستخدم مشرف افتراضي. تحقق من مخرجات السكريبت لمعرفة بيانات الدخول.

---

## الخطوة 5 — نشر الفرونتند على Vercel / Deploy Frontend on Vercel

1. اذهب إلى [vercel.com](https://vercel.com) وسجّل الدخول.
2. انقر **Add New → Project**.
3. اربط مستودع GitHub واختر مجلد `frontend` كـ Root Directory.
4. قبل النشر، أضف متغير البيئة التالي:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://student-management-backend.onrender.com/api`
     *(استبدل هذا بالرابط الفعلي من Render)*
5. انقر **Deploy**.

> سيكتشف Vercel ملف `vercel.json` تلقائياً ويضبط الإعدادات المطلوبة.

---

## الخطوة 6 — ضبط CORS_ORIGIN على Render / Set CORS_ORIGIN on Render

بعد نجاح نشر Vercel:

1. انسخ رابط الفرونتند من Vercel (مثل: `https://your-app.vercel.app`).
2. في لوحة تحكم Render → Web Service → **Environment**.
3. أضف أو حدّث المتغير:
   - **Key**: `CORS_ORIGIN`
   - **Value**: `https://your-app.vercel.app`
4. احفظ التغييرات — سيُعيد Render النشر تلقائياً.

---

## الخطوة 7 — إعداد المتغيرات السرية على Render / Set Secret Env Vars on Render

في لوحة تحكم Render → Web Service → **Environment**، أضف:

| المتغير / Key        | القيمة / Value                              |
|----------------------|---------------------------------------------|
| `JWT_SECRET`         | سلسلة عشوائية طويلة (min 64 chars)         |
| `JWT_REFRESH_SECRET` | سلسلة عشوائية مختلفة (min 64 chars)        |

لتوليد قيم آمنة:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

شغّل هذا الأمر مرتين للحصول على قيمتين مختلفتين.

---

## قائمة متغيرات البيئة / Environment Variables Checklist

### Render (Backend) — مُضبوطة تلقائياً من render.yaml:
- [x] `NODE_ENV` = `production`
- [x] `PORT` = `10000`
- [x] `DB_HOST` — من قاعدة البيانات
- [x] `DB_PORT` — من قاعدة البيانات
- [x] `DB_USER` — من قاعدة البيانات
- [x] `DB_PASSWORD` — من قاعدة البيانات
- [x] `DB_NAME` — من قاعدة البيانات
- [x] `DATABASE_URL` — من قاعدة البيانات
- [x] `BCRYPT_SALT_ROUNDS` = `12`

### Render (Backend) — يجب ضبطها يدوياً:
- [ ] `JWT_SECRET` — سلسلة عشوائية آمنة
- [ ] `JWT_REFRESH_SECRET` — سلسلة عشوائية آمنة
- [ ] `CORS_ORIGIN` — رابط Vercel (مثال: `https://your-app.vercel.app`)

### Vercel (Frontend) — يجب ضبطها يدوياً:
- [ ] `VITE_API_URL` — رابط الباكند على Render (مثال: `https://student-management-backend.onrender.com/api`)

---

## ملاحظات مهمة / Important Notes

- **الخطة المجانية على Render**: الخدمة تدخل في وضع السكون بعد 15 دقيقة من عدم النشاط. أول طلب بعد السكون قد يستغرق ~30 ثانية.
- **قاعدة البيانات المجانية على Render**: تنتهي صلاحيتها بعد 90 يوماً. ستحتاج إلى الترقية أو إنشاء قاعدة بيانات جديدة.
- **تحديث الرابط**: بعد النشر، تأكد من تحديث `VITE_API_URL` على Vercel بالرابط الفعلي من Render.

---

## هيكل الملفات المضافة / Added Files Summary

```
Al-aytam/
├── render.yaml                    # Render deployment config (backend + DB)
├── DEPLOYMENT.md                  # This guide
├── backend/
│   └── src/config/database.ts    # Updated: supports DATABASE_URL
└── frontend/
    ├── vercel.json                # Vercel deployment config
    ├── vite.config.ts             # Updated: added build + proxy config
    ├── .env                       # Development: VITE_API_URL
    └── .env.production            # Production: VITE_API_URL placeholder
```
