/**
 * AttendanceForm — modal dialog for:
 *  - ADD mode: select a session + pick students via checkboxes → bulk create
 *  - EDIT mode: modify status and notes for a single attendance record
 *
 * Implements Requirements 4.2, 4.3, 4.4, 4.5:
 *  - Session selector (dropdown from /api/sessions)
 *  - Full student list with checkboxes (from /api/students) for ADD mode
 *    — "تحديد الكل" (Select All) button                       — Req 4.3
 *    — "إلغاء الكل" (Deselect All) button                     — Req 4.3
 *  - Status + notes fields for EDIT mode                        — Req 4.5
 *
 * Usage:
 *  <AttendanceForm
 *    open={dialogOpen}
 *    attendance={editingAttendance}   // null → ADD/bulk mode
 *    onClose={handleClose}
 *    onSubmitBulk={handleBulkSubmit}
 *    onSubmitEdit={handleEditSubmit}
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
  List,
  ListItem,
  ListItemText,
  Checkbox,
  FormControlLabel,
  Chip,
  Stack,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';

import api from '../../config/api';
import type { ApiResponse } from '../../config/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Session {
  id: number;
  sessionNumber: number;
  sessionDate: string;
}

interface Student {
  id: number;
  firstName: string;
  lastName: string;
}

/** A full Attendance record as returned by the backend */
export interface Attendance {
  id: number;
  session: Session;
  student: Student;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Values submitted when editing a single attendance record */
export interface AttendanceEditValues {
  status: string;
  notes: string;
}

/** Values submitted when doing a bulk create */
export interface AttendanceBulkValues {
  sessionId: number;
  studentIds: number[];
  status: string;
  notes: string;
}

export interface AttendanceFormProps {
  open: boolean;
  /** null → ADD/bulk mode; existing record → EDIT mode */
  attendance?: Attendance | null;
  onClose: () => void;
  onSubmitBulk: (values: AttendanceBulkValues) => Promise<void>;
  onSubmitEdit: (id: number, values: AttendanceEditValues) => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: 'present', label: 'حاضر' },
  { value: 'absent',  label: 'غائب' },
  { value: 'late',    label: 'متأخر' },
];

// ─── Helper ──────────────────────────────────────────────────────────────────

function toDateString(raw: string): string {
  if (!raw) return '';
  return String(raw).split('T')[0];
}

function formatDate(raw: string): string {
  const date = toDateString(raw);
  if (!date) return '';
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AttendanceForm({
  open,
  attendance,
  onClose,
  onSubmitBulk,
  onSubmitEdit,
}: AttendanceFormProps) {
  const isEditing = attendance != null;

  // ── Remote data ────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadError, setLoadError] = useState('');

  // ── ADD mode state ─────────────────────────────────────────────────────────
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [checkedStudentIds, setCheckedStudentIds] = useState<Set<number>>(new Set());
  const [sessionError, setSessionError] = useState('');
  const [studentsError, setStudentsError] = useState('');

  // ── Shared state (status + notes used in both modes) ──────────────────────
  const [status, setStatus] = useState('present');
  const [notes, setNotes] = useState('');

  // ── Submission state ───────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Load sessions and students when the dialog opens ──────────────────────
  useEffect(() => {
    if (!open) return;

    setLoadError('');
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
        setLoadError('فشل تحميل البيانات. الرجاء إغلاق النافذة والمحاولة مرة أخرى.');
      } finally {
        setLoadingOptions(false);
      }
    };

    void loadOptions();
  }, [open]);

  // ── Reset form when dialog opens / edit target changes ────────────────────
  useEffect(() => {
    if (!open) return;

    if (isEditing) {
      setStatus(attendance.status ?? 'present');
      setNotes(attendance.notes ?? '');
    } else {
      setSelectedSessionId('');
      setCheckedStudentIds(new Set());
      setStatus('present');
      setNotes('');
    }
    setSessionError('');
    setStudentsError('');
  }, [open, attendance, isEditing]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Toggle a single student's checked state */
  const handleToggleStudent = (id: number) => {
    setCheckedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    setStudentsError('');
  };

  /** Select all students — Requirement 4.3 */
  const handleSelectAll = () => {
    setCheckedStudentIds(new Set(students.map((s) => s.id)));
    setStudentsError('');
  };

  /** Deselect all students — Requirement 4.3 */
  const handleDeselectAll = () => {
    setCheckedStudentIds(new Set());
  };

  const handleClose = () => {
    if (!isSubmitting) onClose();
  };

  const handleSubmit = async () => {
    if (isEditing) {
      // EDIT mode
      setIsSubmitting(true);
      try {
        await onSubmitEdit(attendance.id, { status, notes });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ADD/bulk mode — validate
    let hasError = false;
    if (!selectedSessionId) {
      setSessionError('الجلسة مطلوبة');
      hasError = true;
    }
    if (checkedStudentIds.size === 0) {
      setStudentsError('يجب اختيار طالب واحد على الأقل');
      hasError = true;
    }
    if (hasError) return;

    setIsSubmitting(true);
    try {
      await onSubmitBulk({
        sessionId: Number(selectedSessionId),
        studentIds: Array.from(checkedStudentIds),
        status,
        notes,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const allChecked = students.length > 0 && checkedStudentIds.size === students.length;
  const someChecked = checkedStudentIds.size > 0 && !allChecked;
  const checkedCount = checkedStudentIds.size;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      dir="rtl"
      aria-labelledby="attendance-form-dialog-title"
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <DialogTitle
        id="attendance-form-dialog-title"
        sx={{ fontWeight: 700, fontSize: '1.15rem', pb: 1 }}
      >
        {isEditing ? 'تعديل سجل الحضور' : 'تسجيل الحضور'}
      </DialogTitle>

      <Divider />

      {/* ── Form body ──────────────────────────────────────────────────────── */}
      <DialogContent sx={{ pt: 2, pb: 1 }}>
        {loadError && (
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            {loadError}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 0.5 }}>

          {/* ── Session selector (ADD mode only) ─────────────────────────── */}
          {!isEditing && (
            <FormControl
              fullWidth
              size="small"
              error={Boolean(sessionError)}
              disabled={isSubmitting || loadingOptions}
              required
            >
              <InputLabel id="attendance-session-label">الجلسة</InputLabel>
              <Select
                labelId="attendance-session-label"
                label="الجلسة"
                value={selectedSessionId}
                onChange={(e) => {
                  setSelectedSessionId(e.target.value);
                  setSessionError('');
                }}
              >
                {sessions.length === 0 && !loadingOptions && (
                  <MenuItem value="" disabled>
                    لا توجد جلسات
                  </MenuItem>
                )}
                {sessions.map((s) => (
                  <MenuItem key={s.id} value={String(s.id)}>
                    {`جلسة ${s.sessionNumber} — ${formatDate(s.sessionDate)}`}
                  </MenuItem>
                ))}
              </Select>
              {sessionError && (
                <FormHelperText>{sessionError}</FormHelperText>
              )}
            </FormControl>
          )}

          {/* ── Session + student info chips (EDIT mode only) ──────────────── */}
          {isEditing && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                label={`الجلسة: ${attendance.session.sessionNumber} — ${formatDate(attendance.session.sessionDate)}`}
                color="primary"
                variant="outlined"
              />
              <Chip
                size="small"
                label={`الطالب: ${attendance.student.firstName} ${attendance.student.lastName}`}
                color="secondary"
                variant="outlined"
              />
            </Box>
          )}

          {/* ── Status selector ───────────────────────────────────────────── */}
          <FormControl fullWidth size="small" disabled={isSubmitting}>
            <InputLabel id="attendance-status-label">حالة الحضور</InputLabel>
            <Select
              labelId="attendance-status-label"
              label="حالة الحضور"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* ── Notes ─────────────────────────────────────────────────────── */}
          <TextField
            label="ملاحظات"
            size="small"
            fullWidth
            multiline
            rows={2}
            disabled={isSubmitting}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="ملاحظات اختيارية..."
          />

          {/* ── Student checkboxes (ADD mode only) ────────────────────────── */}
          {!isEditing && (
            <Box>
              {/* Section header */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 1,
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}
                >
                  <PeopleIcon fontSize="small" />
                  قائمة الطلاب
                  {checkedCount > 0 && (
                    <Chip
                      size="small"
                      label={`${checkedCount} محدد`}
                      color="primary"
                      sx={{ mr: 0.5 }}
                    />
                  )}
                </Typography>

                {/* ── تحديد الكل / إلغاء الكل buttons — Requirement 4.3 ── */}
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={handleSelectAll}
                    disabled={isSubmitting || loadingOptions || allChecked || students.length === 0}
                    startIcon={<CheckBoxIcon fontSize="small" />}
                    sx={{ fontSize: '0.78rem', py: 0.25 }}
                  >
                    تحديد الكل
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="inherit"
                    onClick={handleDeselectAll}
                    disabled={isSubmitting || loadingOptions || checkedCount === 0}
                    startIcon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                    sx={{ fontSize: '0.78rem', py: 0.25 }}
                  >
                    إلغاء الكل
                  </Button>
                </Stack>
              </Box>

              {/* Validation error */}
              {studentsError && (
                <Typography variant="caption" color="error" sx={{ mb: 0.5, display: 'block' }}>
                  {studentsError}
                </Typography>
              )}

              {/* Loading spinner */}
              {loadingOptions ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={28} />
                </Box>
              ) : students.length === 0 ? (
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    p: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    لا يوجد طلاب مسجلون في النظام
                  </Typography>
                </Box>
              ) : (
                /* Student list */
                <Box
                  sx={{
                    border: '1px solid',
                    borderColor: studentsError ? 'error.main' : 'divider',
                    borderRadius: 1,
                    maxHeight: 280,
                    overflowY: 'auto',
                  }}
                >
                  {/* "Select all" master checkbox row */}
                  <ListItem
                    dense
                    disablePadding
                    sx={{
                      px: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'grey.50',
                    }}
                  >
                    <FormControlLabel
                      sx={{ width: '100%', m: 0 }}
                      control={
                        <Checkbox
                          size="small"
                          checked={allChecked}
                          indeterminate={someChecked}
                          onChange={() => {
                            if (allChecked || someChecked) {
                              handleDeselectAll();
                            } else {
                              handleSelectAll();
                            }
                          }}
                          disabled={isSubmitting}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {allChecked
                            ? 'إلغاء تحديد الكل'
                            : someChecked
                            ? `تحديد الكل (${students.length - checkedCount} متبقٍ)`
                            : 'تحديد الكل'}
                        </Typography>
                      }
                    />
                  </ListItem>

                  {/* Individual student rows — Requirement 4.3 */}
                  <List dense disablePadding>
                    {students.map((student) => (
                      <ListItem
                        key={student.id}
                        dense
                        disablePadding
                        sx={{
                          px: 1,
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <FormControlLabel
                          sx={{ width: '100%', m: 0 }}
                          control={
                            <Checkbox
                              size="small"
                              checked={checkedStudentIds.has(student.id)}
                              onChange={() => handleToggleStudent(student.id)}
                              disabled={isSubmitting}
                            />
                          }
                          label={
                            <ListItemText
                              primary={`${student.firstName} ${student.lastName}`}
                              slotProps={{ primary: { variant: 'body2' } }}
                            />
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </Box>
      </DialogContent>

      <Divider />

      {/* ── Footer actions ─────────────────────────────────────────────────── */}
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
          onClick={() => void handleSubmit()}
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

export default AttendanceForm;
