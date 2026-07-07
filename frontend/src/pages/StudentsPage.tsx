import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Button, Container, Snackbar, Alert, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

import { DataTable } from '../shared/components/DataTable';
import type { Column, PaginationConfig } from '../shared/types';
import api from '../config/api';
import type { ApiResponse } from '../config/api';
import { StudentForm } from '../components/students/StudentForm';
import type { Student, StudentFormValues } from '../components/students/StudentForm';

// ─── Types ─────────────────────────────────────────────────────────────────────
// Student and StudentFormValues types are imported from StudentForm component.

// ─── Table columns ─────────────────────────────────────────────────────────────

const COLUMNS: Column<Student>[] = [
  {
    field: 'id',
    headerName: 'رقم تسلسلي',
    minWidth: 110,
  },
  {
    field: 'firstName',
    headerName: 'اسم الطالب',
    minWidth: 140,
  },
  {
    field: 'lastName',
    headerName: 'الكنية',
    minWidth: 130,
  },
  {
    field: 'guardianName',
    headerName: 'اسم الولي',
    minWidth: 150,
  },
  {
    field: 'age',
    headerName: 'العمر',
    minWidth: 90,
  },
  {
    field: 'notes',
    headerName: 'الملاحظات',
    minWidth: 180,
    renderCell: (row) => row.notes ?? '—',
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * StudentsPage — full CRUD page for managing students.
 *
 * Features:
 * - Displays all students in a sortable, searchable DataTable
 * - Add / Edit students via a FormDialog modal
 * - Delete with confirmation (handled inside DataTable)
 * - Auto-assigned serial number (id) on create
 * - Arabic UI with RTL layout
 * - Success / error toast notifications
 * - Pagination support
 */
export default function StudentsPage() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 0,
    pageSize: 10,
    total: 0,
  });

  // ── Search / sort state ─────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Student | string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ── Dialog state ────────────────────────────────────────────────────────────
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // ── Toast state ─────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  // ── Fetch students ──────────────────────────────────────────────────────────
  const fetchStudents = useCallback(
    async (page = pagination.page, pageSize = pagination.pageSize) => {
      setLoading(true);
      try {
        const response = await api.get<ApiResponse<Student[]>>('/api/students', {
          params: {
            page: page + 1, // backend is 1-based
            limit: pageSize,
          },
        });

        const data = response.data;
        if (data.success && data.data) {
          setStudents(data.data);
          setPagination((prev) => ({
            ...prev,
            page,
            pageSize,
            total: data.meta?.total ?? data.data!.length,
          }));
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'فشل تحميل بيانات الطلاب';
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
    void fetchStudents(0, 10);
  }, [fetchStudents]);

  // ── Client-side search (filter already-loaded page) ─────────────────────────
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter(
      (s) =>
        s.firstName.toLowerCase().includes(q) ||
        s.lastName.toLowerCase().includes(q) ||
        s.guardianName.toLowerCase().includes(q) ||
        String(s.age).includes(q) ||
        (s.notes ?? '').toLowerCase().includes(q),
    );
  }, [students, searchQuery]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const showToast = (message: string, severity: 'success' | 'error') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingStudent(null);
  };

  const handleSubmit = async (formData: StudentFormValues) => {
    const payload = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      guardianName: formData.guardianName.trim(),
      age: Number(formData.age),
      notes: formData.notes?.trim() || null,
    };

    if (editingStudent) {
      // Update — serial number (id) is preserved
      await api.put<ApiResponse<Student>>(`/api/students/${editingStudent.id}`, payload);
      showToast('تم تحديث بيانات الطالب بنجاح', 'success');
    } else {
      // Create — serial number is auto-assigned by the backend
      await api.post<ApiResponse<Student>>('/api/students', payload);
      showToast('تمت إضافة الطالب بنجاح', 'success');
    }

    handleCloseDialog();
    void fetchStudents(pagination.page, pagination.pageSize);
  };

  const handleDelete = async (student: Student) => {
    try {
      await api.delete(`/api/students/${student.id}`);
      showToast('تم حذف الطالب بنجاح', 'success');
      void fetchStudents(pagination.page, pagination.pageSize);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل حذف الطالب';
      showToast(msg, 'error');
    }
  };

  const handleSort = (field: keyof Student, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
    // Client-side sort on currently loaded page
    setStudents((prev) =>
      [...prev].sort((a, b) => {
        const aVal = a[field as keyof Student];
        const bVal = b[field as keyof Student];
        const cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''), 'ar', { numeric: true });
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
    void fetchStudents(page, pageSize);
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
          إدارة الطلاب
        </Typography>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
        >
          إضافة طالب
        </Button>
      </Box>

      {/* Students table */}
      <DataTable<Student>
        columns={COLUMNS}
        data={filteredStudents}
        loading={loading}
        pagination={pagination}
        onEdit={handleOpenEdit}
        onDelete={handleDelete}
        onSort={handleSort as (field: keyof Student, direction: 'asc' | 'desc') => void}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        rtl
      />

      {/* Add / Edit dialog */}
      <StudentForm
        open={dialogOpen}
        student={editingStudent}
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
