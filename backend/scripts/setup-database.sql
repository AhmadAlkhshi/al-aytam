-- نص SQL لإنشاء قاعدة البيانات والمستخدم
-- Setup script for PostgreSQL database

-- ====================================
-- خطوة 1: إنشاء قاعدة البيانات
-- Step 1: Create database
-- ====================================

-- تشغيل هذا الأمر كمستخدم postgres
-- Run this as postgres user

CREATE DATABASE student_management_system
    WITH 
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TEMPLATE = template0;

-- ====================================
-- خطوة 2: إنشاء مستخدم للتطبيق (اختياري)
-- Step 2: Create application user (optional but recommended)
-- ====================================

-- CREATE USER sms_user WITH ENCRYPTED PASSWORD 'change_this_password';

-- ====================================
-- خطوة 3: منح الصلاحيات
-- Step 3: Grant privileges
-- ====================================

-- GRANT ALL PRIVILEGES ON DATABASE student_management_system TO sms_user;

-- ====================================
-- للاتصال بقاعدة البيانات الجديدة:
-- To connect to the new database:
-- \c student_management_system
-- ====================================

-- ====================================
-- التحقق من الإنشاء
-- Verify creation
-- ====================================

-- SELECT datname FROM pg_database WHERE datname = 'student_management_system';
