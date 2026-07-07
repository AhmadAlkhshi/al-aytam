/**
 * PointForm — modal dialog for adding and editing student points records.
 *
 * Implements Requirement 3.2:
 *  - Session selector (dropdown populated from /api/sessions)
 *  - Student selector (dropdown populated from /api/students)
 *  - Reason: free-text input
 *  - Points: numeric input (integer)
 *  - Action: optional free-text input (حقل الإجراء)
 *
 * Supports ADD mode (point = null) and EDIT mode (point = existing record).
 *
 * Usage:
 *  <PointForm
 *    open={dialogOpen}
 *    point={editingPoint}   // null → ADD mode
 *    onClose={handleClose}
 *    onSubmit={handleSubmit}
 *  />
 */

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  Divider,
  Typography,
  FormHelperText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

import api from '../../config/api';
import type { ApiResponse } from '../../config/api';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Session data returned by the backend */
interface Session {
  id: number;
  sessionNumber: number;
  sessionDate: string;
}

/** Student data returned by the backend */
interface Student {
  id: number;
  firstName: string;
  lastName: string;
}

/** The full Point entity as returned by the backend */
export interface Point {
  id: number;
  session: Session;
  student: Student;
  reason: string;
  points: number;
  action: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Form values used inside the form before submission */
export interface PointFormValues {
  /** ID of the selected session (stored as string for form compatibility) */
  sessionId: string;
  /** ID of the selected student (stored as string for form compatibility) */
  studentId: string;
  /** Reason for the points */
  reason: string;
  /** Points count — stored as string, cast to number on submit */
  points: string;
  /** Optional action field (حقل الإجراء) */
  action: string;
}

export interface PointFormProps {
  /** Controls whether the dialog is visible */
  open: boolean;
  /**
   * The point record to edit.
   * Pass null (or omit) to open in ADD mode.
   */
  point?: Point | null;
  /** Called when the user cancels / closes the dialog */
  onClose: () => void;
  /**
   * Called with the parsed form values when the user saves.
   * The parent is responsible for making the API call and closing the dialog.
   * Should return a Promise — a loading spinner is shown while pending.
   */
  onSubmit: (values: PointFormValues) => Promise<void>;
}

// ─── Validation schema ────────────────────────────────────────────────────────

const POINT_VALIDATION_SCHEMA = Yup.object({
  sessionId: Yup.string()
    .required('الجلسة مطلوبة')
    .test('not-empty', 'الجلسة مطلوبة', (v) => !!v && v !== ''),
  studentId: Yup.string()
    .required('الطالب مطلوب')
    .test('not-empty', 'الطالب مطلوب', (v) => !!v && v !== ''),
  reason: Yup.string()
    .required('السبب مطلوب')
    .max(255, 'السبب يجب ألا يتجاوز 255 حرفاً'),
  points: Yup.number()
    .typeError('عدد النقاط يجب أن يكون رقماً')
    .required('عدد النقاط مطلوب')
    .integer('عدد النقاط يجب أن يكون عدداً صحيحاً'),
  action: Yup.string()
    .max(100, 'الإجراء يجب ألا يتجاوز 100 حرف')
    .optional()
    .default(''),
});

// ─── Helper ──────────────────────────────────────────────────────────────────

function toDateString(raw: string): string {
  if (!raw) return '';
  return String(raw).split('T')[0];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PointForm({
  open,
  point,
  onClose,
  onSubmit,
}: PointFormProps) {
  const isEditing = point != null;

  // ── Remote data for selectors ──────────────────────────────────────────────
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // ── Form setup ─────────────────────────────────────────────────────────────
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PointFormValues>({
    resolver: yupResolver(POINT_VALIDATION_SCHEMA) as any,
    defaultValues: {
      sessionId: '',
      studentId: '',
      reason: '',
      points: '',
      action: '',
    },
  });

  // ── Load sessions and students when the dialog opens ──────────────────────
  useEffect(() => {
    if (!open) return;

    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [sessionsRes, studentsRes] = await Promise.all([
          api.get<ApiResponse<Session[]>>('/api/sessions', { params: { limit: 0 } }),
          api.get<ApiResponse<Student[]>>('/api/students', { params: { limit: 0 } }),
        ]);
        if (sessionsRes.data.success && sessionsRes.data.data) {
          setSessions(sessionsRes.data.data);
        }
        if (studentsRes.data.success && studentsRes.data.data) {
          setStudents(studentsRes.data.data);
        }
      } catch {
        // Silently ignore — selectors will just be empty; parent handles errors
      } finally {
        setLoadingOptions(false);
      }
    };

    void loadOptions();
  }, [open]);

  // ── Reset form when dialog opens / edit target changes ────────────────────
  useEffect(() => {
    if (open) {
      reset(
        isEditing
          ? {
              sessionId: String(point.session.id),
              studentId: String(point.student.id),
              reason: point.reason,
              points: String(point.points),
              action: point.action ?? '',
            }
          : {
              sessionId: '',
              studentId: '',
              reason: '',
              points: '',
              action: '',
            },
      );
    }
  }, [open, point, isEditing, reset]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFormSubmit = handleSubmit(async (data) => {
    try {
      await onSubmit(data);
    } catch {
      // Parent handles error display
    }
  });

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      dir="rtl"
      aria-labelledby="point-form-dialog-title"
    >
      {/* Header */}
      <DialogTitle
        id="point-form-dialog-title"
        sx={{ fontWeight: 700, fontSize: '1.15rem', pb: 1 }}
      >
        {isEditing ? 'تعديل سجل النقاط' : 'إضافة نقاط جديدة'}
      </DialogTitle>

      <Divider />

      {/* Form body */}
      <DialogContent sx={{ pt: 2, pb: 1 }}>
        <Box
          component="form"
          noValidate
          autoComplete="off"
          onSubmit={handleFormSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 0.5 }}
        >
          {/* ── Session selector ─────────────────────────────────────────── */}
          <Controller
            name="sessionId"
            control={control}
            render={({ field: { value, onChange, onBlur } }) => (
              <FormControl
                fullWidth
                size="small"
                error={Boolean(errors.sessionId)}
                disabled={isSubmitting || loadingOptions}
                required
              >
                <InputLabel id="point-session-select-label">الجلسة</InputLabel>
                <Select
                  labelId="point-session-select-label"
                  label="الجلسة"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                >
                  {sessions.map((s) => (
                    <MenuItem key={s.id} value={String(s.id)}>
                      {`جلسة ${s.sessionNumber} — ${toDateString(s.sessionDate)}`}
                    </MenuItem>
                  ))}
                </Select>
                {errors.sessionId && (
                  <FormHelperText>{errors.sessionId.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />

          {/* ── Student selector ──────────────────────────────────────────── */}
          <Controller
            name="studentId"
            control={control}
            render={({ field: { value, onChange, onBlur } }) => (
              <FormControl
                fullWidth
                size="small"
                error={Boolean(errors.studentId)}
                disabled={isSubmitting || loadingOptions}
                required
              >
                <InputLabel id="point-student-select-label">الطالب</InputLabel>
                <Select
                  labelId="point-student-select-label"
                  label="الطالب"
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                >
                  {students.map((st) => (
                    <MenuItem key={st.id} value={String(st.id)}>
                      {`${st.firstName} ${st.lastName}`}
                    </MenuItem>
                  ))}
                </Select>
                {errors.studentId && (
                  <FormHelperText>{errors.studentId.message}</FormHelperText>
                )}
              </FormControl>
            )}
          />

          {/* ── Reason ───────────────────────────────────────────────────── */}
          <Controller
            name="reason"
            control={control}
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label="السبب"
                required
                size="small"
                fullWidth
                disabled={isSubmitting}
                error={Boolean(errors.reason)}
                helperText={
                  errors.reason ? (
                    <Typography component="span" variant="caption" color="error">
                      {errors.reason.message}
                    </Typography>
                  ) : undefined
                }
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="مثال: مشاركة فعّالة في النشاط"
              />
            )}
          />

          {/* ── Points count ──────────────────────────────────────────────── */}
          <Controller
            name="points"
            control={control}
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                type="number"
                label="عدد النقاط"
                required
                size="small"
                fullWidth
                disabled={isSubmitting}
                error={Boolean(errors.points)}
                helperText={
                  errors.points ? (
                    <Typography component="span" variant="caption" color="error">
                      {errors.points.message}
                    </Typography>
                  ) : undefined
                }
                value={String(value ?? '')}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="مثال: 10"
                slotProps={{
                  htmlInput: { step: 1 },
                }}
              />
            )}
          />

          {/* ── Action (حقل الإجراء) — optional ──────────────────────────── */}
          <Controller
            name="action"
            control={control}
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                label="الإجراء"
                size="small"
                fullWidth
                disabled={isSubmitting}
                error={Boolean(errors.action)}
                helperText={
                  errors.action ? (
                    <Typography component="span" variant="caption" color="error">
                      {errors.action.message}
                    </Typography>
                  ) : (
                    <Typography component="span" variant="caption" color="text.secondary">
                      اختياري
                    </Typography>
                  )
                }
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="مثال: مكافأة، تنبيه، ..."
              />
            )}
          />
        </Box>
      </DialogContent>

      <Divider />

      {/* Footer actions */}
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button
          onClick={handleClose}
          variant="outlined"
          color="inherit"
          disabled={isSubmitting}
          startIcon={<CloseIcon />}
        >
          إلغاء
        </Button>

        <Button
          onClick={handleFormSubmit}
          variant="contained"
          color="primary"
          disabled={isSubmitting || loadingOptions}
          startIcon={
            isSubmitting ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <SaveIcon />
            )
          }
        >
          {isSubmitting ? 'جاري الحفظ...' : 'حفظ'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PointForm;
