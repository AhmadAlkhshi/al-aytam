import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Container, Snackbar, Alert, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { DataTable } from '../shared/components/DataTable';
import type { Column, PaginationConfig } from '../shared/types';
import api from '../config/api';
import type { ApiResponse } from '../config/api';
import { PointForm } from '../components/points/PointForm';
import type { Point, PointFormValues } from '../components/points/PointForm';

// ─── Table columns ─────────────────────────────────────────────────────────────

const COLUMNS: Column<Point>[] = [
  {
    field: 'id',
    headerName: 'الرقم',
    minWidth: 80,
  },
  {
    field: 'session',
    headerName: 'تاريخ الجلسة',
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
    field: 'reason',
    headerName: 'السبب',
    minWidth: 200,
  },
  {
    field: 'points',
    headerName: 'عدد النقاط',
    minWidth: 120,
  },
  {
    field: 'action',
    headerName: 'الإجراء',
    minWidth: 140,
    renderCell: (row) => row.action ?? '—',
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * PointsPage — full CRUD page for managing student points records.
 *
 * Features:
 * - Displays all point records in a sortable, searchable DataTable
 * - Add / Edit points via PointForm dialog
 * - Delete with confirmation (handled inside DataTable)
 * - Arabic UI with RTL layout
 * - Success / error toast notifications
 * - Pagination support
 *
 * Implements Requirements 3.1 – 3.6.
 */
export default function PointsPage() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  // ── Search / sort state ─────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Point | string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ── Dialog state ────────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<Point | null>(null);

  // ── Toast state ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // ── Fetch points ────────────────────────────────────────────────────────────
  const fetchPoints = useCallback(
    async (page = 0, pageSize = 10) => {
      setLoading(true);
      try {
        const response = await api.get<ApiResponse<Point[]>>('/api/points', {
          params: {
            page: page + 1, // backend is 1-based
            limit: pageSize,
          },
        });

        const data = response.data;
        if (data.success && data.data) {
          setPoints(data.data);
          setPagination((prev) => ({
            ...prev,
            page,
            pageSize,
            total: data.meta?.total ?? data.data!.length,
          }));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'فشل تحميل النقاط';
        showToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Initial load
  useEffect(() => {
    void fetchPoints(0, 10);
  }, [fetchPoints]);

  // ── Client-side search ──────────────────────────────────────────────────────
  const filteredPoints = useMemo(() => {
    if (!searchQuery.trim()) return points;
    const q = searchQuery.toLowerCase();
    return points.filter((p) => {
      const studentName = p.student
        ? `${p.student.firstName} ${p.student.lastName}`.toLowerCase()
        : '';
      const sessionLabel = p.session
        ? `جلسة ${p.session.sessionNumber}`.toLowerCase()
        : '';
      return (
        studentName.includes(q) ||
        sessionLabel.includes(q) ||
        p.reason.toLowerCase().includes(q) ||
        String(p.points).includes(q) ||
        (p.action ?? '').toLowerCase().includes(q)
      );
    });
  }, [points, searchQuery]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const showToast = (message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  const handleOpenAdd = () => {
    setEditingPoint(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (point: Point) => {
    setEditingPoint(point);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPoint(null);
  };

  const handleSubmit = async (formData: PointFormValues) => {
    const payload = {
      session_id: Number(formData.sessionId),
      student_id: Number(formData.studentId),
      reason: formData.reason.trim(),
      points: Number(formData.points),
      action: formData.action.trim() || null,
    };

    if (editingPoint) {
      // Update — Requirement 3.4, 3.5
      await api.put<ApiResponse<Point>>(
        `/api/points/${editingPoint.id}`,
        payload,
      );
      showToast('تم تحديث سجل النقاط بنجاح', 'success');
    } else {
      // Create — Requirement 3.2, 3.3
      await api.post<ApiResponse<Point>>('/api/points', payload);
      showToast('تمت إضافة النقاط بنجاح', 'success');
    }

    handleCloseDialog();
    void fetchPoints(pagination.page, pagination.pageSize);
  };

  const handleDelete = async (point: Point) => {
    try {
      await api.delete(`/api/points/${point.id}`);
      showToast('تم حذف سجل النقاط بنجاح', 'success');
      void fetchPoints(pagination.page, pagination.pageSize);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل حذف سجل النقاط';
      showToast(msg, 'error');
    }
  };

  const handleSort = (field: keyof Point, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
    setPoints((prev) =>
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
          aVal = String(a[field as keyof Point] ?? '');
          bVal = String(b[field as keyof Point] ?? '');
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
    void fetchPoints(page, pageSize);
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
          إدارة نقاط الطلاب
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
        >
          إضافة نقاط
        </Button>
      </Box>

      {/* Points table */}
      <DataTable<Point>
        columns={COLUMNS}
        data={filteredPoints}
        loading={loading}
        pagination={pagination}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onSort={handleSort as (field: keyof Point, direction: 'asc' | 'desc') => void}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        rtl
      />

      {/* Add / Edit dialog */}
      <PointForm
        open={dialogOpen}
        point={editingPoint}
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
