#!/bin/bash

# نص تلقائي لإنشاء قاعدة البيانات PostgreSQL
# Automated script for creating PostgreSQL database

echo "================================================"
echo "Student Management System - Database Setup"
echo "إعداد قاعدة بيانات نظام إدارة الطلاب"
echo "================================================"
echo ""

# متغيرات قاعدة البيانات
DB_NAME="student_management_system"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

echo "Database configuration:"
echo "  Name: $DB_NAME"
echo "  User: $DB_USER"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo ""

# التحقق من تثبيت PostgreSQL
echo "Checking PostgreSQL installation..."
if ! command -v psql &> /dev/null
then
    echo "❌ Error: PostgreSQL is not installed or not in PATH"
    echo "Please install PostgreSQL first:"
    echo "  - Windows: https://www.postgresql.org/download/windows/"
    echo "  - Or use Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:14"
    exit 1
fi

echo "✓ PostgreSQL is installed"
echo ""

# التحقق من الاتصال بـ PostgreSQL
echo "Testing PostgreSQL connection..."
if ! psql -U $DB_USER -h $DB_HOST -p $DB_PORT -c "SELECT version();" &> /dev/null
then
    echo "❌ Error: Cannot connect to PostgreSQL"
    echo "Please check:"
    echo "  1. PostgreSQL service is running"
    echo "  2. Username and password are correct"
    echo "  3. PostgreSQL is listening on port $DB_PORT"
    exit 1
fi

echo "✓ Connection successful"
echo ""

# التحقق من وجود قاعدة البيانات
echo "Checking if database exists..."
DB_EXISTS=$(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" = "1" ]; then
    echo "⚠ Warning: Database '$DB_NAME' already exists"
    read -p "Do you want to drop and recreate it? (yes/no): " -r
    if [[ $REPLY =~ ^[Yy]([Ee][Ss])?$ ]]; then
        echo "Dropping existing database..."
        psql -U $DB_USER -h $DB_HOST -p $DB_PORT -c "DROP DATABASE IF EXISTS $DB_NAME;"
        echo "✓ Database dropped"
    else
        echo "Keeping existing database. Exiting..."
        exit 0
    fi
fi

# إنشاء قاعدة البيانات
echo "Creating database '$DB_NAME'..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -f "$(dirname "$0")/setup-database.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "================================================"
    echo "✓ Database created successfully!"
    echo "✓ تم إنشاء قاعدة البيانات بنجاح!"
    echo "================================================"
    echo ""
    echo "Next steps:"
    echo "  1. Copy backend/.env.example to backend/.env"
    echo "  2. Update DB_PASSWORD in backend/.env"
    echo "  3. Run: cd backend && npm run typeorm:run"
    echo ""
else
    echo ""
    echo "================================================"
    echo "❌ Error creating database"
    echo "❌ حدث خطأ أثناء إنشاء قاعدة البيانات"
    echo "================================================"
    exit 1
fi
