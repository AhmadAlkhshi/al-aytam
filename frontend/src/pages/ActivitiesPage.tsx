import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Container, Snackbar, Alert, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { DataTable } from '../shared/components/DataTable';
import type { Column, PaginationConfig } from '../shared/types';
import api from '../config/api';
import type { ApiResponse } from '../config/api';
import { ActivityForm } from '../components/activities/ActivityForm';
import type { Activity, ActivityFormValues } from '../components/activities/ActivityForm';

// ─── Table columns ─────────────────────────────────────────────────────────────

const COLUMNS: Column<Activity>[] = [
  {
    field: 'id',
    headerName: 'المعرف',
    minWidth: 80,
  },
  {
    field: 'session',
    headerName: 'الجلسة',
    minWidth: 180,
    renderCell: (row) => {
      if (!row.session) return '—';
      const date = String(row.session.sessionDate).split('T')[0];
      const [year, month, day] = date.split('-');
      return `جلسة ${row.session.sessionNumber} — ${day}/${month}/${year}`;
    },
  },
  {
    field: 'student',
    headerName: 'الطالب',
    minWidth: 160,
    renderCell: (row) => {
      if (!row.student) return '—';
      return `${row.student.firstName} ${row.student.lastName}`;
    },
  },
  {
    field: 'activityType',
    headerName: 'نوع النشاط',
    minWidth: 140,
  },
  {
    field: 'count',
    headerName: 'العدد',
    minWidth: 100,
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * ActivitiesPage — full CRUD page for managing physical activities.
 *
 * Features:
 * - Displays all activities in a sortable, searchable DataTable
 * - Add / Edit activities via ActivityForm dialog
 * - Delete with confirmation (handled inside DataTable)
 * - Arabic UI with RTL layout
 * - Success / error toast notifications
 * - Pagination support
 *
 * Implements Requirements 2.1 – 2.7.
 */
export default function ActivitiesPage() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  // ── Search / sort state ─────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Activity | string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ── Dialog state ────────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // ── Toast state ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // ── Fetch activities ────────────────────────────────────────────────────────
  const fetchActivities = useCallback(
    async (page = 0, pageSize = 10) => {
      setLoading(true);
      try {
        const response = await api.get<ApiResponse<Activity[]>>('/api/activities', {
          params: {
            page: page + 1, // backend is 1-based
            limit: pageSize,
          },
        });

        const data = response.data;
        if (data.success && data.data) {
          setActivities(data.data);
          setPagination((prev) => ({
            ...prev,
            page,
            pageSize,
            total: data.meta?.total ?? data.data!.length,
          }));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'فشل تحميل النشاطات';
        showToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Initial load
  useEffect(() => {
    void fetchActivities(0, 10);
  }, [fetchActivities]);

  // ── Client-side search ──────────────────────────────────────────────────────
  const filteredActivities = useMemo(() => {
    if (!searchQuery.trim()) return activities;
    const q = searchQuery.toLowerCase();
    return activities.filter((a) => {
      const studentName = a.student
        ? `${a.student.firstName} ${a.student.lastName}`.toLowerCase()
        : '';
      const sessionLabel = a.session
        ? `جلسة ${a.session.sessionNumber}`.toLowerCase()
        : '';
      return (
        studentName.includes(q) ||
        sessionLabel.includes(q) ||
        a.activityType.toLowerCase().includes(q) ||
        String(a.count).includes(q)
      );
    });
  }, [activities, searchQuery]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const showToast = (message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  const handleOpenAdd = () => {
    setEditingActivity(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingActivity(null);
  };

  const handleSubmit = async (formData: ActivityFormValues) => {
    const payload = {
      session_id: Number(formData.sessionId),
      student_id: Number(formData.studentId),
      activityType: formData.activityType.trim(),
      count: Number(formData.count),
    };

    if (editingActivity) {
      // Update — Requirement 2.5, 2.6
      await api.put<ApiResponse<Activity>>(
        `/api/activities/${editingActivity.id}`,
        payload,
      );
      showToast('تم تحديث النشاط بنجاح', 'success');
    } else {
      // Create — Requirement 2.2, 2.4
      await api.post<ApiResponse<Activity>>('/api/activities', payload);
      showToast('تمت إضافة النشاط بنجاح', 'success');
    }

    handleCloseDialog();
    void fetchActivities(pagination.page, pagination.pageSize);
  };

  const handleDelete = async (activity: Activity) => {
    try {
      await api.delete(`/api/activities/${activity.id}`);
      showToast('تم حذف النشاط بنجاح', 'success');
      void fetchActivities(pagination.page, pagination.pageSize);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل حذف النشاط';
      showToast(msg, 'error');
    }
  };

  const handleSort = (field: keyof Activity, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
    setActivities((prev) =>
      [...prev].sort((a, b) => {
        let aVal: string;
        let bVal: string;
        if (field === 'student') {
          aVal = a.student ? `${a.student.firstName} ${a.student.lastName}` : '';
          bVal = b.student ? `${b.student.firstName} ${b.student.lastName}` : '';
        } else if (field === 'session') {
          aVal = String(a.session?.sessionNumber ?? '');
          bVal = String(b.session?.sessionNumber ?? '');
        } else {
          aVal = String(a[field as keyof Activity] ?? '');
          bVal = String(b[field as keyof Activity] ?? '');
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
    void fetchActivities(page, pageSize);
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
          إدارة النشاطات الجسدية
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
        >
          إضافة نشاط
        </Button>
      </Box>

      {/* Activities table */}
      <DataTable<Activity>
        columns={COLUMNS}
        data={filteredActivities}
        loading={loading}
        pagination={pagination}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onSort={handleSort as (field: keyof Activity, direction: 'asc' | 'desc') => void}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        rtl
      />

      {/* Add / Edit dialog */}
      <ActivityForm
        open={dialogOpen}
        activity={editingActivity}
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
