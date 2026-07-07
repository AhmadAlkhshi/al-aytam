# نظام إدارة الطلاب - Student Management System

نظام ويب متكامل لإدارة الطلاب، النشاطات الجسدية، النقاط، والحضور مع نظام تقسيم ذكي.

## التقنيات المستخدمة

### Frontend
- React 18 + TypeScript
- Redux Toolkit
- Material-UI (MUI) v5
- React Router v6
- i18next (للغة العربية مع دعم RTL)
- Axios
- React Hook Form + Yup

### Backend
- Node.js 18 + Express.js
- TypeScript
- TypeORM
- PostgreSQL 14+
- JWT Authentication
- Redis (للـ caching)
- Winston (للـ logging)
- bcrypt (لتشفير كلمات المرور)

## البنية

```
.
├── backend/          # Node.js + Express + TypeORM
├── frontend/         # React + TypeScript
├── docker-compose.yml
└── README.md
```

## المتطلبات الأساسية

- Node.js 18 أو أحدث
- PostgreSQL 14 أو أحدث
- Redis (اختياري للتطوير)
- Docker و Docker Compose (اختياري)

## التثبيت والتشغيل

### باستخدام Docker (الطريقة الموصى بها)

```bash
# تشغيل جميع الخدمات
docker-compose up -d

# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
```

### التشغيل المحلي

#### Backend

```bash
cd backend
npm install
cp .env.example .env
# قم بتعديل .env بإعدادات قاعدة البيانات
npm run migrate
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# قم بتعديل REACT_APP_API_URL إذا لزم الأمر
npm start
```

## الميزات الرئيسية

### إدارة البيانات
- ✅ إدارة بيانات الطلاب (الاسم، الكنية، اسم الولي، العمر، ملاحظات)
- ✅ إدارة جلسات النادي (أيام النادي)
- ✅ تسجيل النشاطات الجسدية (ضغط، ثابت، تحمل + نشاطات مخصصة)
- ✅ نظام النقاط مع الأسباب والإجراءات
- ✅ تسجيل الحضور مع حالة الحضور

### التقسيم الذكي
- ✅ تقسيم تلقائي للطلاب الحاضرين إلى فئات (أ) و(ب)
- ✅ قواعد تقسيم محددة للأعداد من 15 إلى 36 طالب
- ✅ تقسيم كل فئة إلى مجموعات صغيرة (5-18 طالب)

### الأمان
- ✅ مصادقة JWT
- ✅ صلاحيات المستخدمين (Admin, Teacher, Viewer)
- ✅ تشفير كلمات المرور
- ✅ حماية من SQL Injection, XSS, CSRF

### الأداء
- ✅ Redis Caching
- ✅ Connection Pooling
- ✅ Pagination
- ✅ Query Optimization

## API Documentation

بعد تشغيل Backend، يمكنك الوصول إلى:
- Swagger UI: http://localhost:5000/api-docs

## الاختبار

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## المساهمة

هذا المشروع تعليمي لإدارة نادي الطلاب.

## الترخيص

MIT License
