/**
 * رسائل الخطأ العربية الموحدة للنظام
 */

/**
 * ترجمة أسماء الحقول الإنجليزية إلى العربية
 */
export const FIELD_NAME_MAP: Record<string, string> = {
  session_id: 'معرف الجلسة',
  student_id: 'معرف الطالب',
  reason: 'السبب',
  points: 'النقاط',
  activityType: 'نوع النشاط',
  count: 'العدد',
  attendances: 'بيانات الحضور',
  username: 'اسم المستخدم',
  password: 'كلمة المرور',
  fullName: 'الاسم الكامل',
  firstName: 'الاسم',
  lastName: 'الكنية',
  guardianName: 'اسم الولي',
  age: 'العمر',
  notes: 'الملاحظات',
  sessionNumber: 'رقم الجلسة',
  sessionDate: 'تاريخ الجلسة',
  status: 'الحالة',
  role: 'الدور',
  email: 'البريد الإلكتروني',
  phone: 'رقم الهاتف',
} as const;

/**
 * إرجاع الاسم العربي للحقل أو الاسم الأصلي إذا لم يوجد ترجمة
 */
export const getArabicFieldName = (field: string): string =>
  FIELD_NAME_MAP[field] ?? field;

export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: (field: string) => `الحقل "${getArabicFieldName(field)}" مطلوب`,
  INVALID_FORMAT: 'صيغة البيانات المرسلة غير صحيحة',
  INVALID_INPUT: 'البيانات المدخلة غير صالحة',
  INVALID_EMAIL: 'صيغة البريد الإلكتروني غير صحيحة',
  INVALID_PHONE: 'رقم الهاتف غير صحيح',
  INVALID_DATE: 'صيغة التاريخ غير صحيحة',
  INVALID_NUMBER: 'القيمة المدخلة يجب أن تكون رقماً',
  MIN_LENGTH: (field: string, min: number) => `يجب أن يكون "${field}" على الأقل ${min} أحرف`,
  MAX_LENGTH: (field: string, max: number) => `يجب أن لا يتجاوز "${field}" ${max} حرفاً`,
  MIN_VALUE: (field: string, min: number) => `يجب أن تكون قيمة "${field}" على الأقل ${min}`,
  MAX_VALUE: (field: string, max: number) => `يجب أن لا تتجاوز قيمة "${field}" ${max}`,
  PASSWORDS_NOT_MATCH: 'كلمات المرور غير متطابقة',
  WEAK_PASSWORD: 'كلمة المرور ضعيفة، يجب أن تحتوي على حروف وأرقام',
} as const;

export const DATABASE_ERROR_MESSAGES = {
  DUPLICATE_ENTRY: 'هذا السجل موجود مسبقاً',
  FOREIGN_KEY_VIOLATION: 'لا يمكن تنفيذ العملية لأن السجل مرتبط بسجلات أخرى',
  NOT_NULL_VIOLATION: 'جميع الحقول المطلوبة يجب أن تكون مملوءة',
  INVALID_TEXT_REPRESENTATION: 'البيانات المدخلة غير صالحة',
  CONNECTION_ERROR: 'تعذّر الاتصال بقاعدة البيانات',
  QUERY_ERROR: 'حدث خطأ أثناء تنفيذ العملية على قاعدة البيانات',
  TRANSACTION_FAILED: 'فشلت العملية، يرجى المحاولة مرة أخرى',
} as const;

export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'اسم المستخدم أو كلمة المرور غير صحيحة',
  TOKEN_EXPIRED: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً',
  TOKEN_INVALID: 'رمز المصادقة غير صالح',
  TOKEN_MISSING: 'يجب تسجيل الدخول للوصول إلى هذه الصفحة',
  UNAUTHORIZED: 'ليس لديك صلاحية للوصول إلى هذا المورد',
  ACCOUNT_DISABLED: 'هذا الحساب معطّل، يرجى التواصل مع المسؤول',
  SESSION_EXPIRED: 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً',
  FORBIDDEN: 'ليس لديك الصلاحيات الكافية لتنفيذ هذه العملية',
} as const;

export const NOT_FOUND_MESSAGES = {
  GENERIC: 'المورد المطلوب غير موجود',
  STUDENT: 'الطالب غير موجود',
  SESSION: 'الجلسة غير موجودة',
  ACTIVITY: 'النشاط غير موجود',
  USER: 'المستخدم غير موجود',
  RECORD: 'السجل غير موجود',
  DIVISION: 'الفصل الدراسي غير موجود',
  ATTENDANCE: 'سجل الحضور غير موجود',
  POINT: 'سجل النقاط غير موجود',
  ROUTE: 'المسار المطلوب غير موجود',
} as const;
