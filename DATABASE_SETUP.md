# دليل إعداد قاعدة البيانات PostgreSQL

## نظرة عامة

هذا الدليل يشرح كيفية إعداد قاعدة بيانات PostgreSQL لنظام إدارة الطلاب. يتوفر عدة خيارات حسب بيئة التطوير المفضلة لديك.

---

## الخيار 1: استخدام Docker (الأسرع والأسهل - موصى به)

### المتطلبات
- Docker Desktop مثبت على النظام

### خطوات التنفيذ

1. **انتقل إلى مجلد scripts:**
   ```bash
   cd backend/scripts
   ```

2. **شغّل Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **تحقق من أن الخدمات تعمل:**
   ```bash
   docker-compose ps
   ```

يجب أن ترى:
- ✓ `sms-postgres` - قاعدة البيانات PostgreSQL على المنفذ 5432
- ✓ `sms-redis` - Redis للتخزين المؤقت على المنفذ 6379 (اختياري)
- ✓ `sms-pgadmin` - واجهة إدارة قاعدة البيانات على المنفذ 5050 (اختياري)

4. **معلومات الاتصال:**
   ```
   Host: localhost
   Port: 5432
   Database: student_management_system
   Username: postgres
   Password: postgres
   ```

5. **للوصول إلى pgAdmin (اختياري):**
   - URL: http://localhost:5050
   - Email: admin@example.com
   - Password: admin

### أوامر مفيدة

```bash
# إيقاف الخدمات
docker-compose down

# إيقاف وحذف البيانات
docker-compose down -v

# عرض logs
docker-compose logs -f postgres

# إعادة تشغيل
docker-compose restart
```

---

## الخيار 2: التثبيت المحلي على Windows

### التحميل والتثبيت

1. **تحميل PostgreSQL:**
   - الرابط: https://www.postgresql.org/download/windows/
   - أو من EDB: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - الإصدار الموصى به: PostgreSQL 14 أو أحدث

2. **تشغيل المثبت:**
   - اختر كلمة مرور قوية لمستخدم `postgres` (احتفظ بها!)
   - احتفظ بالمنفذ الافتراضي `5432`
   - اختر locale: `English, United States`
   - ثبّت جميع المكونات (بما في ذلك pgAdmin 4)

3. **إضافة PostgreSQL إلى PATH (إذا لم يتم تلقائياً):**
   - افتح "Edit the system environment variables"
   - اضغط "Environment Variables"
   - أضف إلى PATH: `C:\Program Files\PostgreSQL\14\bin`

### إنشاء قاعدة البيانات

**الطريقة 1: باستخدام PowerShell Script (موصى به)**

```powershell
cd backend/scripts
.\setup-database.ps1
```

سيطلب منك:
- كلمة مرور مستخدم postgres
- تأكيد إنشاء قاعدة البيانات

**الطريقة 2: يدوياً باستخدام psql**

```bash
# افتح PowerShell أو CMD
psql -U postgres

# داخل psql، نفّذ:
CREATE DATABASE student_management_system
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8';

# (اختياري) إنشاء مستخدم خاص
CREATE USER sms_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE student_management_system TO sms_user;

# الخروج
\q
```

**الطريقة 3: باستخدام pgAdmin 4**

1. افتح pgAdmin 4
2. اتصل بالخادم المحلي (PostgreSQL 14)
3. انقر بزر الماوس الأيمن على "Databases" → "Create" → "Database"
4. اسم قاعدة البيانات: `student_management_system`
5. اضغط "Save"

---

## الخيار 3: خدمات سحابية مجانية

### Supabase (موصى به - 500MB مجاناً)

1. انتقل إلى: https://supabase.com
2. أنشئ حساب مجاني
3. اضغط "New Project"
4. أدخل:
   - Project name: student-management-system
   - Database Password: (كلمة مرور قوية)
   - Region: (الأقرب إليك)
5. انتظر حتى يتم إنشاء المشروع (1-2 دقيقة)
6. انتقل إلى Settings → Database
7. انسخ Connection String (URI)

### ElephantSQL (20MB مجاناً)

1. انتقل إلى: https://www.elephantsql.com
2. أنشئ حساب مجاني
3. اضغط "Create New Instance"
4. اختر plan: "Tiny Turtle" (Free)
5. اختر datacenter قريب منك
6. انسخ URL من صفحة تفاصيل الـ instance

### Railway (5$ رصيد مجاني شهرياً)

1. انتقل إلى: https://railway.app
2. أنشئ حساب باستخدام GitHub
3. اضغط "New Project"
4. اختر "Provision PostgreSQL"
5. انتقل إلى Variables tab
6. انسخ DATABASE_URL

### Render (90 يوم مجاناً)

1. انتقل إلى: https://render.com
2. أنشئ حساب مجاني
3. اضغط "New" → "PostgreSQL"
4. أدخل:
   - Name: student-management-db
   - Database: student_management_system
   - User: postgres
5. اضغط "Create Database"
6. انسخ Internal Database URL

---

## إعداد ملف البيئة

بعد إنشاء قاعدة البيانات، قم بإعداد ملف `.env`:

### 1. انسخ ملف المثال

```bash
cd backend
copy .env.example .env
```

أو على macOS/Linux:
```bash
cp .env.example .env
```

### 2. حدّث معلومات الاتصال

**للاتصال المحلي أو Docker:**

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=student_management_system
```

**أو استخدم Connection URL مباشرة:**

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/student_management_system
```

**للخدمات السحابية:**

```env
# استخدم الـ URL الذي حصلت عليه من الخدمة
DATABASE_URL=postgresql://user:password@host:port/database
```

---

## التحقق من الاتصال

### باستخدام psql

```bash
# محلي
psql -U postgres -d student_management_system -c "SELECT version();"

# سحابي (استخدم الـ URL)
psql "postgresql://user:pass@host:port/dbname" -c "SELECT version();"
```

### باستخدام Node.js

قم بإنشاء ملف `test-connection.js`:

```javascript
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/student_management_system'
});

client.connect()
  .then(() => {
    console.log('✓ Successfully connected to PostgreSQL!');
    return client.query('SELECT version()');
  })
  .then(result => {
    console.log('✓ PostgreSQL version:', result.rows[0].version);
  })
  .catch(err => {
    console.error('✗ Connection error:', err.message);
  })
  .finally(() => {
    client.end();
  });
```

شغّله:
```bash
node test-connection.js
```

---

## الخطوات التالية

بعد إنشاء قاعدة البيانات بنجاح:

1. ✅ تأكد من إعداد ملف `.env` بشكل صحيح
2. ⏭️ المهمة التالية: **1.3.2 إعداد TypeORM connection**
3. 🔄 سيتم إنشاء الجداول تلقائياً عند تشغيل الـ migrations في المرحلة 2

---

## استكشاف الأخطاء الشائعة

### ❌ "psql: command not found"

**الحل:**
- تأكد من تثبيت PostgreSQL
- أضف PostgreSQL إلى PATH
- أو استخدم Docker

### ❌ "FATAL: password authentication failed"

**الحل:**
1. تحقق من كلمة المرور في ملف `.env`
2. للمستخدم postgres، قد تحتاج لإعادة تعيين كلمة المرور:
   ```sql
   ALTER USER postgres WITH PASSWORD 'new_password';
   ```

### ❌ "could not connect to server"

**الحل:**
1. تحقق من أن PostgreSQL يعمل:
   ```bash
   # Windows
   Get-Service -Name postgresql*
   
   # أو ابحث عن "Services" وابحث عن postgresql
   ```

2. تحقق من المنفذ:
   ```bash
   netstat -an | findstr 5432
   ```

3. تحقق من firewall

### ❌ "database does not exist"

**الحل:**
1. تأكد من إنشاء قاعدة البيانات
2. تحقق من الاسم في `.env` (student_management_system)

### ❌ "FATAL: role does not exist"

**الحل:**
1. تأكد من أن اسم المستخدم صحيح
2. أو أنشئ المستخدم:
   ```sql
   CREATE USER your_user WITH PASSWORD 'your_password';
   ```

### ❌ "too many clients already"

**الحل:**
1. زيادة max_connections في postgresql.conf
2. أو أغلق الاتصالات غير المستخدمة
3. أو استخدم connection pooling

---

## موارد إضافية

- **PostgreSQL Documentation**: https://www.postgresql.org/docs/
- **pgAdmin Documentation**: https://www.pgadmin.org/docs/
- **TypeORM Documentation**: https://typeorm.io/
- **Docker PostgreSQL**: https://hub.docker.com/_/postgres

---

## ملاحظات أمنية

⚠️ **مهم للإنتاج:**

1. **لا تستخدم كلمات مرور ضعيفة** (مثل "postgres" أو "password")
2. **لا تشارك ملف `.env`** - أضفه إلى `.gitignore`
3. **استخدم SSL/TLS** للاتصالات في الإنتاج
4. **قم بعمل نسخ احتياطية** منتظمة
5. **قيّد الوصول** إلى قاعدة البيانات (firewall rules)
6. **استخدم مستخدم منفصل** للتطبيق (ليس postgres)

---

## الدعم

إذا واجهت مشاكل:
1. تحقق من الأخطاء الشائعة أعلاه
2. راجع logs:
   - PostgreSQL logs: عادة في `C:\Program Files\PostgreSQL\14\data\log`
   - Docker logs: `docker-compose logs postgres`
3. تأكد من صحة معلومات الاتصال في `.env`
