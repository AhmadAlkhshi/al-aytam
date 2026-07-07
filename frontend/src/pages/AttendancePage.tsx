import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Container, Snackbar, Alert, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { DataTable } from '../shared/components/DataTable';
import type { Column, PaginationConfig } from '../shared/types';
import api from '../config/api';
import type { ApiResponse } from '../config/api';
import { AttendanceForm } from '../components/attendance/AttendanceForm';
import type {
  Attendance,
  AttendanceBulkValues,
  AttendanceEditValues,
} from '../components/attendance/AttendanceForm';

// ─── Status label map ──────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  present: 'حاضر',
  absent: 'غائب',
  late: 'متأخر',
};

// ─── Table columns ─────────────────────────────────────────────────────────────

const COLUMNS: Column<Attendance>[] = [
  {
    field: 'id',
    headerName: 'الرقم',
    minWidth: 80,
  },
  {
    field: 'session',
    headerName: 'الجلسة',
    minWidth: 200,
    renderCell: (row) => {
      if (!row.session) return '—';
      const date = String(row.session.sessionDate).split('T')[0];
      const [year, month, day] = date.split('-');
      return `جلسة ${row.session.sessionNumber} — ${day}/${month}/${year}`;
    },
  },
  {
    field: 'student',
    headerName: 'اسم الطالب',
    minWidth: 160,
    renderCell: (row) => {
      if (!row.student) return '—';
      return `${row.student.firstName} ${row.student.lastName}`;
    },
  },
  {
    field: 'status',
    headerName: 'حالة الحضور',
    minWidth: 130,
    renderCell: (row) => STATUS_LABELS[row.status] ?? row.status,
  },
  {
    field: 'notes',
    headerName: 'الملاحظات',
    minWidth: 200,
    renderCell: (row) => row.notes ?? '—',
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * AttendancePage — full CRUD page for managing student attendance records.
 *
 * Features:
 * - Displays all attendance records in a sortable, searchable DataTable
 * - Add attendance via bulk dialog (session + student checkboxes) — Req 4.2, 4.3, 4.4
 * - Edit individual attendance records (status + notes) — Req 4.5
 * - Delete attendance records
 * - Arabic UI with RTL layout
 * - Toast notifications
 * - Pagination support
 *
 * Implements Requirements 4.1 – 4.6.
 */
export default function AttendancePage() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  // ── Search / sort state ─────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Attendance | string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ── Dialog state ────────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);

  // ── Toast state ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // ── Fetch attendances ───────────────────────────────────────────────────────
  const fetchAttendances = useCallback(async (page = 0, pageSize = 10) => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<Attendance[]>>('/api/attendances', {
        params: {
          page: page + 1, // backend is 1-based
          limit: pageSize,
        },
      });

      const data = response.data;
      if (data.success && data.data) {
        setAttendances(data.data);
        setPagination((prev) => ({
          ...prev,
          page,
          pageSize,
          total: data.meta?.total ?? data.data!.length,
        }));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تحميل سجلات الحضور';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    void fetchAttendances(0, 10);
  }, [fetchAttendances]);

  // ── Client-side search ──────────────────────────────────────────────────────
  const filteredAttendances = useMemo(() => {
    if (!searchQuery.trim()) return attendances;
    const q = searchQuery.toLowerCase();
    return attendances.filter((a) => {
      const studentName = a.student
        ? `${a.student.firstName} ${a.student.lastName}`.toLowerCase()
        : '';
      const sessionLabel = a.session
        ? `جلسة ${a.session.sessionNumber}`.toLowerCase()
        : '';
      const statusLabel = STATUS_LABELS[a.status]?.toLowerCase() ?? a.status.toLowerCase();
      return (
        studentName.includes(q) ||
        sessionLabel.includes(q) ||
        statusLabel.includes(q) ||
        (a.notes ?? '').toLowerCase().includes(q)
      );
    });
  }, [attendances, searchQuery]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const showToast = (message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  const handleOpenAdd = () => {
    setEditingAttendance(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (record: Attendance) => {
    setEditingAttendance(record);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAttendance(null);
  };

  /**
   * Bulk create attendance — Requirement 4.4
   * Sends one record per selected student to POST /api/attendances/bulk
   */
  const handleSubmitBulk = async (values: AttendanceBulkValues) => {
    const payload = {
      session_id: values.sessionId,
      attendances: values.studentIds.map((sid) => ({
        student_id: sid,
        status: values.status,
        notes: values.notes.trim() || null,
      })),
    };

    await api.post('/api/attendances/bulk', payload);
    showToast(
      `تم تسجيل حضور ${values.studentIds.length} طالب بنجاح`,
      'success',
    );
    handleCloseDialog();
    void fetchAttendances(pagination.page, pagination.pageSize);
  };

  /**
   * Edit a single attendance record — Requirement 4.5, 4.6
   */
  const handleSubmitEdit = async (id: number, values: AttendanceEditValues) => {
    await api.put(`/api/attendances/${id}`, {
      status: values.status,
      notes: values.notes.trim() || null,
    });
    showToast('تم تحديث سجل الحضور بنجاح', 'success');
    handleCloseDialog();
    void fetchAttendances(pagination.page, pagination.pageSize);
  };

  const handleDelete = async (record: Attendance) => {
    try {
      await api.delete(`/api/attendances/${record.id}`);
      showToast('تم حذف سجل الحضور بنجاح', 'success');
      void fetchAttendances(pagination.page, pagination.pageSize);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل حذف سجل الحضور';
      showToast(msg, 'error');
    }
  };

  const handleSort = (field: keyof Attendance, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
    setAttendances((prev) =>
      [...prev].sort((a, b) => {
        let aVal: string;
        let bVal: string;
        if (field === 'student') {
          aVal = a.student ? `${a.student.firstName} ${a.student.lastName}` : '';
          bVal = b.student ? `${b.student.firstName} ${b.student.lastName}` : '';
        } else if (field === 'session') {
          aVal = String(a.session?.sessionNumber ?? '');
          bVal = String(b.session?.sessionNumber ?? '');
        } else if (field === 'status') {
          aVal = STATUS_LABELS[a.status] ?? a.status;
          bVal = STATUS_LABELS[b.status] ?? b.status;
        } else {
          aVal = String(a[field as keyof Attendance] ?? '');
          bVal = String(b[field as keyof Attendance] ?? '');
        }
        const cmp = aVal.localeCompare(bVal, 'ar', { numeric: true });
        return direction === 'asc' ? cmp : -cmp;
      }),
    );
    // Suppress unused-variable warnings
    void sortField;
    void sortDirection;
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handlePageChange = (page: number, pageSize: number) => {
    void fetchAttendances(page, pageSize);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Container maxWidth="lg" dir="rtl">
      {/* Page header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          إدارة حضور الطلاب
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
        >
          إضافة حضور
        </Button>
      </Box>

      {/* Attendance table — Requirement 4.1 */}
      <DataTable<Attendance>
        columns={COLUMNS}
        data={filteredAttendances}
        loading={loading}
        pagination={pagination}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onSort={handleSort as (field: keyof Attendance, direction: 'asc' | 'desc') => void}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        rtl
      />

      {/* Add (bulk) / Edit dialog */}
      <AttendanceForm
        open={dialogOpen}
        attendance={editingAttendance}
        onClose={handleCloseDialog}
        onSubmitBulk={handleSubmitBulk}
        onSubmitEdit={handleSubmitEdit}
      />

      {/* Toast notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseToast}
          severity={toast.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
