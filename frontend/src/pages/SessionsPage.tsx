import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Container, Snackbar, Alert, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import * as Yup from 'yup';

import { DataTable } from '../shared/components/DataTable';
import { FormDialog } from '../shared/components/FormDialog';
import type { FormField } from '../shared/components/FormDialog';
import type { Column, PaginationConfig } from '../shared/types';
import api from '../config/api';
import type { ApiResponse } from '../config/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Session {
  id: number;
  sessionNumber: number;
  sessionDate: string; // ISO date string (YYYY-MM-DD)
  createdAt: string;
  updatedAt: string;
}

interface SessionFormValues {
  sessionNumber: string;
  sessionDate: string;
}

// ─── Form configuration ────────────────────────────────────────────────────────

const SESSION_FIELDS: FormField[] = [
  {
    name: 'sessionNumber',
    label: 'رقم الجلسة',
    type: 'number',
    required: true,
    min: 1,
    placeholder: 'مثال: 1',
  },
  {
    name: 'sessionDate',
    label: 'تاريخ الجلسة',
    type: 'date',
    required: true,
  },
];

const SESSION_VALIDATION_SCHEMA = Yup.object({
  sessionNumber: Yup.number()
    .typeError('رقم الجلسة يجب أن يكون رقماً')
    .required('رقم الجلسة مطلوب')
    .min(1, 'رقم الجلسة يجب أن يكون أكبر من أو يساوي 1')
    .integer('رقم الجلسة يجب أن يكون عدداً صحيحاً'),
  sessionDate: Yup.string()
    .required('تاريخ الجلسة مطلوب')
    .matches(/^\d{4}-\d{2}-\d{2}$/, 'صيغة التاريخ غير صحيحة'),
});

// ─── Table columns ─────────────────────────────────────────────────────────────

const COLUMNS: Column<Session>[] = [
  {
    field: 'id',
    headerName: 'المعرف',
    minWidth: 80,
  },
  {
    field: 'sessionNumber',
    headerName: 'رقم الجلسة',
    minWidth: 120,
  },
  {
    field: 'sessionDate',
    headerName: 'تاريخ الجلسة',
    minWidth: 160,
    renderCell: (row) => {
      // Format date as DD/MM/YYYY for Arabic UI
      if (!row.sessionDate) return '';
      const [year, month, day] = row.sessionDate.split('T')[0].split('-');
      return `${day}/${month}/${year}`;
    },
  },
];

// ─── Helper ────────────────────────────────────────────────────────────────────

/**
 * Normalise the raw sessionDate field.
 * The backend may return a full ISO timestamp or just a date string.
 * We only need the YYYY-MM-DD part.
 */
function toDateString(raw: string | Date): string {
  if (!raw) return '';
  return String(raw).split('T')[0];
}

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * SessionsPage — full CRUD page for managing club sessions.
 *
 * Features:
 * - Displays all sessions in a sortable, searchable DataTable
 * - Add / Edit sessions via a FormDialog modal
 * - Delete with confirmation (handled inside DataTable)
 * - Arabic UI with RTL layout
 * - Success / error toast notifications
 */
export default function SessionsPage() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  // ── Search / sort state ─────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Session | string>('sessionNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ── Dialog state ────────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  // ── Toast state ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // ── Fetch sessions ──────────────────────────────────────────────────────────
  const fetchSessions = useCallback(
    async (page = pagination.page, pageSize = pagination.pageSize) => {
      setLoading(true);
      try {
        const response = await api.get<ApiResponse<Session[]>>('/api/sessions', {
          params: {
            page: page + 1, // backend is 1-based
            limit: pageSize,
          },
        });

        const data = response.data;
        if (data.success && data.data) {
          setSessions(data.data);
          setPagination((prev) => ({
            ...prev,
            page,
            pageSize,
            total: data.meta?.total ?? data.data!.length,
          }));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'فشل تحميل الجلسات';
        showToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Initial load
  useEffect(() => {
    void fetchSessions(0, 10);
  }, [fetchSessions]);

  // ── Client-side search (filter already-loaded page) ─────────────────────────
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        String(s.sessionNumber).includes(q) ||
        toDateString(s.sessionDate).includes(q),
    );
  }, [sessions, searchQuery]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const showToast = (message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  const handleOpenAdd = () => {
    setEditingSession(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (session: Session) => {
    setEditingSession(session);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingSession(null);
  };

  const handleSubmit = async (formData: SessionFormValues) => {
    const payload = {
      sessionNumber: Number(formData.sessionNumber),
      sessionDate: formData.sessionDate,
    };

    if (editingSession) {
      // Update
      await api.put<ApiResponse<Session>>(`/api/sessions/${editingSession.id}`, payload);
      showToast('تم تحديث الجلسة بنجاح', 'success');
    } else {
      // Create
      await api.post<ApiResponse<Session>>('/api/sessions', payload);
      showToast('تمت إضافة الجلسة بنجاح', 'success');
    }

    handleCloseDialog();
    void fetchSessions(pagination.page, pagination.pageSize);
  };

  const handleDelete = async (session: Session) => {
    try {
      await api.delete(`/api/sessions/${session.id}`);
      showToast('تم حذف الجلسة بنجاح', 'success');
      void fetchSessions(pagination.page, pagination.pageSize);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل حذف الجلسة';
      showToast(msg, 'error');
    }
  };

  const handleSort = (field: keyof Session, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
    // Client-side sort on currently loaded page
    setSessions((prev) =>
      [...prev].sort((a, b) => {
        const aVal = a[field as keyof Session];
        const bVal = b[field as keyof Session];
        const cmp = String(aVal).localeCompare(String(bVal), 'ar', { numeric: true });
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
    void fetchSessions(page, pageSize);
  };

  // ── Initial values for the edit form ──────────────────────────────────────
  const dialogInitialValues: SessionFormValues | undefined = editingSession
    ? {
        sessionNumber: String(editingSession.sessionNumber),
        sessionDate: toDateString(editingSession.sessionDate),
      }
    : undefined;

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
          إدارة الجلسات
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
        >
          إضافة جلسة
        </Button>
      </Box>

      {/* Sessions table */}
      <DataTable<Session>
        columns={COLUMNS}
        data={filteredSessions}
        loading={loading}
        pagination={pagination}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onSort={handleSort as (field: keyof Session, direction: 'asc' | 'desc') => void}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        rtl
      />

      {/* Add / Edit dialog */}
      <FormDialog
        open={dialogOpen}
        title={editingSession ? 'تعديل الجلسة' : 'إضافة جلسة جديدة'}
        fields={SESSION_FIELDS}
        initialValues={dialogInitialValues}
        validationSchema={SESSION_VALIDATION_SCHEMA}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
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
