# قائمة المهام MVP - نظام إدارة الطلاب

## نظرة عامة

نسخة MVP مختصرة تركز على الوظائف الأساسية فقط للتسليم السريع.

**التقنيات:**
- Frontend: React + TypeScript + Material-UI (بدون Redux - Context API فقط)
- Backend: Node.js + Express + TypeORM
- Database: PostgreSQL
- Authentication: JWT بسيط

**ما تم حذفه من النسخة الكاملة:**
- ❌ Redis Caching
- ❌ Property-Based Tests (نبقي فقط Unit Tests أساسية)
- ❌ E2E Tests
- ❌ Docker setup
- ❌ CI/CD Pipeline
- ❌ Advanced optimization
- ❌ Swagger documentation

---

## المرحلة 1: إعداد سريع

### [ ] 1.1 إعداد Backend
- [x] 1.1.1 إنشاء مجلد backend + npm init
- [x] 1.1.2 تثبيت التبعيات الأساسية فقط (express, typeorm, pg, typescript, bcrypt, jsonwebtoken)
- [x] 1.1.3 إنشاء tsconfig.json
- [x] 1.1.4 إنشاء .env.example

### [ ] 1.2 إعداد Frontend
- [x] 1.2.1 إنشاء React app مع Vite
- [x] 1.2.2 تثبيت MUI + React Router + Axios
- [x] 1.2.3 إعداد RTL support

### [ ] 1.3 إعداد Database
- [x] 1.3.1 إنشاء PostgreSQL database
- [x] 1.3.2 إعداد TypeORM connection

---

## المرحلة 2: Database Schema (مبسط)

### [ ] 2.1 إنشاء Entities
- [x] 2.1.1 Session entity (id, sessionNumber, sessionDate)
- [x] 2.1.2 Student entity (id, firstName, lastName, guardianName, age, notes)
- [x] 2.1.3 Activity entity (id, session_id, student_id, activityType, count)
- [x] 2.1.4 Point entity (id, session_id, student_id, reason, points, action)
- [x] 2.1.5 Attendance entity (id, session_id, student_id, status, notes)
- [x] 2.1.6 User entity (id, username, password, role)

### [ ] 2.2 تشغيل Migrations
- [x] 2.2.1 إنشاء migrations لجميع الجداول
- [ ] 2.2.2 تشغيل migrations
- [x] 2.2.3 إنشاء user admin أولي

---

## المرحلة 3: Backend API (الأساسيات فقط)

### [ ] 3.1 Auth Module
- [x] 3.1.1 POST /api/auth/login (JWT)
- [x] 3.1.2 middleware للتحقق من JWT
- [x] 3.1.3 password hashing مع bcrypt

### [ ] 3.2 Sessions API
- [x] 3.2.1 GET /api/sessions
- [x] 3.2.2 POST /api/sessions
- [x] 3.2.3 PUT /api/sessions/:id
- [x] 3.2.4 DELETE /api/sessions/:id

### [ ] 3.3 Students API
- [x] 3.3.1 GET /api/students (مع pagination بسيط)
- [x] 3.3.2 POST /api/students
- [x] 3.3.3 PUT /api/students/:id
- [x] 3.3.4 DELETE /api/students/:id

### [ ] 3.4 Activities API
- [x] 3.4.1 GET /api/activities
- [x] 3.4.2 POST /api/activities
- [x] 3.4.3 PUT /api/activities/:id
- [x] 3.4.4 DELETE /api/activities/:id

### [ ] 3.5 Points API
- [x] 3.5.1 GET /api/points
- [x] 3.5.2 POST /api/points
- [x] 3.5.3 PUT /api/points/:id
- [x] 3.5.4 DELETE /api/points/:id

### [ ] 3.6 Attendance API
- [x] 3.6.1 GET /api/attendances
- [x] 3.6.2 POST /api/attendances/bulk (للحضور الجماعي)
- [x] 3.6.3 PUT /api/attendances/:id
- [x] 3.6.4 GET /api/attendances/session/:sessionId

### [ ] 3.7 Division API
- [x] 3.7.1 POST /api/division/calculate (حساب التقسيم)
- [x] 3.7.2 تطبيق category rules (15-36)
- [x] 3.7.3 تطبيق group rules (5-18)

### [ ] 3.8 Error Handling أساسي
- [x] 3.8.1 global error middleware
- [x] 3.8.2 validation errors
- [x] 3.8.3 rسائل خطأ بالعربي

---

## المرحلة 4: Frontend (مبسط مع Context API)

### [ ] 4.1 Setup
- [x] 4.1.1 إعداد React Router
- [x] 4.1.2 إعداد MUI Theme مع RTL
- [x] 4.1.3 إعداد Axios client
- [x] 4.1.4 إنشاء AuthContext (بدلاً من Redux)
- [x] 4.1.5 إنشاء DataContext لباقي البيانات

### [ ] 4.2 Auth Pages
- [x] 4.2.1 LoginPage
- [x] 4.2.2 Protected Route wrapper

### [ ] 4.3 Shared Components (أساسي)
- [x] 4.3.1 DataTable component بسيط
- [x] 4.3.2 FormDialog component
- [x] 4.3.3 Layout component

### [ ] 4.4 Sessions Feature
- [x] 4.4.1 SessionsPage (list + add + edit + delete)
- [x] 4.4.2 SessionForm

### [ ] 4.5 Students Feature
- [x] 4.5.1 StudentsPage
- [x] 4.5.2 StudentForm (مع جميع الحقول)

### [ ] 4.6 Activities Feature
- [x] 4.6.1 ActivitiesPage
- [x] 4.6.2 ActivityForm (dropdown + text input)

### [ ] 4.7 Points Feature
- [x] 4.7.1 PointsPage
- [x] 4.7.2 PointForm

### [ ] 4.8 Attendance Feature
- [x] 4.8.1 AttendancePage
- [x] 4.8.2 AttendanceForm (مع checkboxes لجميع الطلاب)

### [ ] 4.9 Division Feature
- [x] 4.9.1 DivisionPage
- [x] 4.9.2 عرض الفئات والمجموعات

---

## المرحلة 5: Testing أساسي (اختياري - يمكن تخطيه للسرعة)

### [ ] 5.1 Backend Tests
- [x] 5.1.1 test للـ division logic فقط
- [x] 5.1.2 test للـ auth فقط

### [ ] 5.2 Frontend Tests
- [x] 5.2.1 smoke tests للمكونات الرئيسية فقط

---

## المرحلة 6: Deployment بسيط

### [ ] 6.1 إعداد Production
- [x] 6.1.1 إنشاء production .env
- [x] 6.1.2 build للـ frontend
- [x] 6.1.3 build للـ backend

### [ ] 6.2 Deploy
- [x] 6.2.1 deploy على Heroku أو Vercel (مجاني)
- [x] 6.2.2 deploy database على نفس المنصة

---

## ملاحظات MVP

### ما يجب أن يعمل:
✅ تسجيل دخول بسيط
✅ إدارة الجلسات (CRUD)
✅ إدارة الطلاب مع الحقول الجديدة (CRUD)
✅ إدارة النشاطات مع نوع مرن (CRUD)
✅ إدارة النقاط مع حقل action (CRUD)
✅ تسجيل حضور جماعي
✅ التقسيم الذكي للطلاب (categories + groups)
✅ واجهة عربية مع RTL

### ما تم تأجيله:
⏸️ Redis caching
⏸️ Advanced error handling
⏸️ Comprehensive testing
⏸️ Docker
⏸️ CI/CD
⏸️ API documentation
⏸️ Monitoring & logging
⏸️ Performance optimization

### تقدير الوقت للـ MVP:
- **المرحلة 1**: 2-3 ساعات
- **المرحلة 2**: 2-3 ساعات
- **المرحلة 3**: 6-8 ساعات
- **المرحلة 4**: 8-10 ساعات
- **المرحلة 5**: 1-2 ساعات (اختياري)
- **المرحلة 6**: 2-3 ساعات

**إجمالي: 21-29 ساعة عمل متواصل**

---

## الأولوية

1. **مرحلة 1 + 2** (Setup + Database) - يجب
2. **مرحلة 3** (Backend API) - يجب
3. **مرحلة 4** (Frontend) - يجب
4. **مرحلة 6** (Deploy) - يجب
5. **مرحلة 5** (Testing) - اختياري

**يمكن تسليم MVP خلال 1-2 أيام عمل مكثف!**
