# نص PowerShell لإنشاء قاعدة البيانات PostgreSQL على Windows
# PowerShell script for creating PostgreSQL database on Windows

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Student Management System - Database Setup" -ForegroundColor Cyan
Write-Host "إعداد قاعدة بيانات نظام إدارة الطلاب" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# متغيرات قاعدة البيانات
$DB_NAME = "student_management_system"
$DB_USER = "postgres"
$DB_HOST = "localhost"
$DB_PORT = "5432"

Write-Host "Database configuration:"
Write-Host "  Name: $DB_NAME"
Write-Host "  User: $DB_USER"
Write-Host "  Host: $DB_HOST"
Write-Host "  Port: $DB_PORT"
Write-Host ""

# التحقق من تثبيت PostgreSQL
Write-Host "Checking PostgreSQL installation..." -ForegroundColor Yellow
$psqlCommand = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psqlCommand) {
    Write-Host "❌ Error: PostgreSQL is not installed or not in PATH" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installation options:" -ForegroundColor Yellow
    Write-Host "  1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "  2. Or use Docker:" -ForegroundColor White
    Write-Host "     docker run -d --name postgres-sms -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:14" -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✓ PostgreSQL is installed" -ForegroundColor Green
Write-Host ""

# طلب كلمة المرور
Write-Host "Enter PostgreSQL password for user '$DB_USER':" -ForegroundColor Yellow
$securePassword = Read-Host -AsSecureString
$PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
)
$env:PGPASSWORD = $PGPASSWORD

# التحقق من الاتصال بـ PostgreSQL
Write-Host "Testing PostgreSQL connection..." -ForegroundColor Yellow
try {
    $null = & psql -U $DB_USER -h $DB_HOST -p $DB_PORT -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Connection failed"
    }
    Write-Host "✓ Connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Cannot connect to PostgreSQL" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check:" -ForegroundColor Yellow
    Write-Host "  1. PostgreSQL service is running" -ForegroundColor White
    Write-Host "  2. Username and password are correct" -ForegroundColor White
    Write-Host "  3. PostgreSQL is listening on port $DB_PORT" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# التحقق من وجود قاعدة البيانات
Write-Host "Checking if database exists..." -ForegroundColor Yellow
$dbExists = & psql -U $DB_USER -h $DB_HOST -p $DB_PORT -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>$null

if ($dbExists -eq "1") {
    Write-Host "⚠ Warning: Database '$DB_NAME' already exists" -ForegroundColor Yellow
    $response = Read-Host "Do you want to drop and recreate it? (yes/no)"
    
    if ($response -match "^[Yy](es)?$") {
        Write-Host "Dropping existing database..." -ForegroundColor Yellow
        & psql -U $DB_USER -h $DB_HOST -p $DB_PORT -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>&1 | Out-Null
        Write-Host "✓ Database dropped" -ForegroundColor Green
    } else {
        Write-Host "Keeping existing database. Exiting..." -ForegroundColor Cyan
        Read-Host "Press Enter to exit"
        exit 0
    }
}

# إنشاء قاعدة البيانات
Write-Host "Creating database '$DB_NAME'..." -ForegroundColor Yellow

$sqlScript = Join-Path $PSScriptRoot "setup-database.sql"
& psql -U $DB_USER -h $DB_HOST -p $DB_PORT -f $sqlScript 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "✓ Database created successfully!" -ForegroundColor Green
    Write-Host "✓ تم إنشاء قاعدة البيانات بنجاح!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Copy backend/.env.example to backend/.env" -ForegroundColor White
    Write-Host "  2. Update DB_PASSWORD in backend/.env" -ForegroundColor White
    Write-Host "  3. Run: cd backend && npm run typeorm:run" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "❌ Error creating database" -ForegroundColor Red
    Write-Host "❌ حدث خطأ أثناء إنشاء قاعدة البيانات" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
}

# تنظيف
$env:PGPASSWORD = $null

Write-Host ""
Read-Host "Press Enter to exit"
