/**
 * ActivityForm — modal dialog for adding and editing physical activities.
 *
 * Implements Requirement 2.2 and 2.3:
 *  - Session selector (dropdown populated from /api/sessions)
 *  - Student selector (dropdown populated from /api/students)
 *  - Activity type: MUI Autocomplete with freeSolo so the user can pick
 *    one of the three predefined options ("ضغط", "ثابت", "تحمل") or type
 *    any custom activity text.
 *  - Count: numeric input (integer ≥ 0)
 *
 * Supports ADD mode (activity = null) and EDIT mode (activity = existing record).
 *
 * Usage:
 *  <ActivityForm
 *    open={dialogOpen}
 *    activity={editingActivity}   // null → ADD mode
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
  MenuItem,
  Box,
  CircularProgress,
  Divider,
  Typography,
  FormHelperText,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

import api from '../../config/api';
import type { ApiResponse } from '../../config/api';

// ─── Constants ────────────────────────────────────────────────────────────────

/** The three predefined activity type options (Requirement 2.3) */
const PREDEFINED_ACTIVITY_TYPES = ['ضغط', 'ثابت', 'تحمل'];

// ─── Types ───────────────────────────────────────────────────────────────────

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

/** The full Activity entity as returned by the backend */
export interface Activity {
  id: number;
  session: Session;
  student: Student;
  activityType: string;
  count: number;
  createdAt: string;
  updatedAt: string;
}

/** Form values used inside the form before submission */
export interface ActivityFormValues {
  /** ID of the selected session (stored as string for form compatibility) */
  sessionId: string;
  /** ID of the selected student (stored as string for form compatibility) */
  studentId: string;
  /** Activity type — one of the predefined options or custom free text */
  activityType: string;
  /** Count — stored as string, cast to number on submit */
  count: string;
}

export interface ActivityFormProps {
  /** Controls whether the dialog is visible */
  open: boolean;
  /**
   * The activity to edit.
   * Pass null (or omit) to open in ADD mode.
   */
  activity?: Activity | null;
  /** Called when the user cancels / closes the dialog */
  onClose: () => void;
  /**
   * Called with the parsed form values when the user saves.
   * The parent is responsible for making the API call and closing the dialog.
   * Should return a Promise — a loading spinner is shown while pending.
   */
  onSubmit: (values: ActivityFormValues) => Promise<void>;
}

// ─── Validation schema ────────────────────────────────────────────────────────

const ACTIVITY_VALIDATION_SCHEMA = Yup.object({
  sessionId: Yup.string()
    .required('الجلسة مطلوبة')
    .test('not-empty', 'الجلسة مطلوبة', (v) => !!v && v !== ''),
  studentId: Yup.string()
    .required('الطالب مطلوب')
    .test('not-empty', 'الطالب مطلوب', (v) => !!v && v !== ''),
  activityType: Yup.string()
    .required('نوع النشاط مطلوب')
    .max(50, 'نوع النشاط يجب ألا يتجاوز 50 حرفاً'),
  count: Yup.number()
    .typeError('العدد يجب أن يكون رقماً')
    .required('العدد مطلوب')
    .min(0, 'العدد يجب أن يكون 0 أو أكبر')
    .integer('العدد يجب أن يكون عدداً صحيحاً'),
});

// ─── Helper ──────────────────────────────────────────────────────────────────

function toDateString(raw: string): string {
  if (!raw) return '';
  return String(raw).split('T')[0];
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ActivityForm({
  open,
  activity,
  onClose,
  onSubmit,
}: ActivityFormProps) {
  const isEditing = activity != null;

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
  } = useForm<ActivityFormValues>({
    resolver: yupResolver(ACTIVITY_VALIDATION_SCHEMA) as any,
    defaultValues: {
      sessionId: '',
      studentId: '',
      activityType: '',
      count: '',
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
              sessionId: String(activity.session.id),
              studentId: String(activity.student.id),
              activityType: activity.activityType,
              count: String(activity.count),
            }
          : {
              sessionId: '',
              studentId: '',
              activityType: '',
              count: '',
            },
      );
    }
  }, [open, activity, isEditing, reset]);

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
      aria-labelledby="activity-form-dialog-title"
    >
      {/* Header */}
      <DialogTitle
        id="activity-form-dialog-title"
        sx={{ fontWeight: 700, fontSize: '1.15rem', pb: 1 }}
      >
        {isEditing ? 'تعديل النشاط' : 'إضافة نشاط جديد'}
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
                <InputLabel id="session-select-label">الجلسة</InputLabel>
                <Select
                  labelId="session-select-label"
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
                <InputLabel id="student-select-label">الطالب</InputLabel>
                <Select
                  labelId="student-select-label"
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

          {/* ── Activity type: Autocomplete with freeSolo ─────────────────── */}
          {/*
            Requirement 2.3: THREE predefined options + free text allowed.
            Using freeSolo so the user can also type any custom activity.
          */}
          <Controller
            name="activityType"
            control={control}
            render={({ field: { value, onChange, onBlur } }) => (
              <Autocomplete
                freeSolo
                options={PREDEFINED_ACTIVITY_TYPES}
                value={value}
                onChange={(_event, newValue) => {
                  // newValue is string | null when freeSolo is set
                  onChange(newValue ?? '');
                }}
                onInputChange={(_event, newInputValue) => {
                  // Keep the form value in sync while the user types freely
                  onChange(newInputValue);
                }}
                onBlur={onBlur}
                disabled={isSubmitting}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="نوع النشاط"
                    required
                    size="small"
                    error={Boolean(errors.activityType)}
                    helperText={
                      errors.activityType ? (
                        <Typography component="span" variant="caption" color="error">
                          {errors.activityType.message}
                        </Typography>
                      ) : (
                        <Typography component="span" variant="caption" color="text.secondary">
                          اختر من القائمة أو اكتب نوعاً مخصصاً
                        </Typography>
                      )
                    }
                    placeholder="مثال: ضغط، ثابت، تحمل، أو أي نشاط آخر"
                  />
                )}
              />
            )}
          />

          {/* ── Count ────────────────────────────────────────────────────── */}
          <Controller
            name="count"
            control={control}
            render={({ field: { value, onChange, onBlur } }) => (
              <TextField
                type="number"
                label="العدد"
                required
                size="small"
                fullWidth
                disabled={isSubmitting}
                error={Boolean(errors.count)}
                helperText={
                  errors.count ? (
                    <Typography component="span" variant="caption" color="error">
                      {errors.count.message}
                    </Typography>
                  ) : undefined
                }
                value={String(value ?? '')}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="مثال: 20"
                slotProps={{
                  htmlInput: { min: 0, step: 1 },
                }}
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

export default ActivityForm;
