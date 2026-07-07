/**
 * StudentForm — dedicated form component for adding and editing students.
 *
 * Wraps the shared FormDialog with all student-specific fields, validation
 * schema, and Arabic labels. Supports both ADD and EDIT modes.
 *
 * Fields:
 *  - firstName   (اسم الطالب)   — required, 2–100 chars
 *  - lastName    (الكنية)       — required, 2–100 chars
 *  - guardianName (اسم الولي)  — required, 2–100 chars
 *  - age         (العمر)        — required, integer 1–99
 *  - notes       (الملاحظات)   — optional free text
 *
 * Usage:
 *  <StudentForm
 *    open={dialogOpen}
 *    student={editingStudent}   // null for ADD mode
 *    onClose={handleClose}
 *    onSubmit={handleSubmit}
 *  />
 */

import * as Yup from 'yup';

import { FormDialog } from '../../shared/components/FormDialog';
import type { FormField } from '../../shared/components/FormDialog';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Shape of the Student entity returned by the backend. */
export interface Student {
  id: number;
  firstName: string;
  lastName: string;
  guardianName: string;
  age: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Values collected by the form before submission. */
export interface StudentFormValues {
  firstName: string;
  lastName: string;
  guardianName: string;
  /** Age is kept as a string inside the form and cast to number on submit. */
  age: string;
  notes: string;
}

export interface StudentFormProps {
  /** Controls whether the dialog is visible. */
  open: boolean;
  /**
   * The student to edit.
   * Pass `null` (or omit) to open the form in ADD mode.
   */
  student?: Student | null;
  /** Called when the user cancels / closes the dialog. */
  onClose: () => void;
  /**
   * Called with the parsed form values when the user saves.
   * The parent is responsible for making the API call and closing the dialog.
   * Should return a Promise — a loading spinner is shown while it's pending.
   */
  onSubmit: (values: StudentFormValues) => Promise<void>;
}

// ─── Form configuration ─────────────────────────────────────────────────────

const STUDENT_FIELDS: FormField[] = [
  {
    name: 'firstName',
    label: 'اسم الطالب',
    type: 'text',
    required: true,
    placeholder: 'مثال: محمد',
  },
  {
    name: 'lastName',
    label: 'الكنية',
    type: 'text',
    required: true,
    placeholder: 'مثال: العمري',
  },
  {
    name: 'guardianName',
    label: 'اسم الولي',
    type: 'text',
    required: true,
    placeholder: 'مثال: أحمد العمري',
  },
  {
    name: 'age',
    label: 'العمر',
    type: 'number',
    required: true,
    min: 1,
    max: 99,
    placeholder: 'مثال: 12',
  },
  {
    name: 'notes',
    label: 'الملاحظات',
    type: 'textarea',
    required: false,
    rows: 3,
    placeholder: 'أي ملاحظات إضافية...',
  },
];

const STUDENT_VALIDATION_SCHEMA = Yup.object({
  firstName: Yup.string()
    .required('اسم الطالب مطلوب')
    .min(2, 'اسم الطالب يجب أن يحتوي على حرفين على الأقل')
    .max(100, 'اسم الطالب طويل جداً'),
  lastName: Yup.string()
    .required('الكنية مطلوبة')
    .min(2, 'الكنية يجب أن تحتوي على حرفين على الأقل')
    .max(100, 'الكنية طويلة جداً'),
  guardianName: Yup.string()
    .required('اسم الولي مطلوب')
    .min(2, 'اسم الولي يجب أن يحتوي على حرفين على الأقل')
    .max(100, 'اسم الولي طويل جداً'),
  age: Yup.number()
    .typeError('العمر يجب أن يكون رقماً')
    .required('العمر مطلوب')
    .min(1, 'العمر يجب أن يكون أكبر من 0')
    .max(99, 'العمر يجب أن يكون أقل من 100')
    .integer('العمر يجب أن يكون عدداً صحيحاً'),
  notes: Yup.string().nullable().optional(),
});

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * StudentForm renders a modal dialog for adding or editing a student.
 *
 * - ADD mode  : `student` prop is null/undefined → dialog title is "إضافة طالب جديد"
 * - EDIT mode : `student` prop is a Student object → pre-fills the form
 */
export function StudentForm({ open, student, onClose, onSubmit }: StudentFormProps) {
  const isEditing = student != null;

  const initialValues: StudentFormValues | undefined = isEditing
    ? {
        firstName: student.firstName,
        lastName: student.lastName,
        guardianName: student.guardianName,
        age: String(student.age),
        notes: student.notes ?? '',
      }
    : undefined;

  return (
    <FormDialog
      open={open}
      title={isEditing ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
      fields={STUDENT_FIELDS}
      initialValues={initialValues}
      validationSchema={STUDENT_VALIDATION_SCHEMA}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
}

export default StudentForm;
