import { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
  Skeleton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Column, PaginationConfig } from '../types';

// ─── Props ──────────────────────────────────────────────────────────────────

interface DataTableProps<T> {
  /** Column definitions */
  columns: Column<T>[];
  /** Rows to display on the current page */
  data: T[];
  /** Show loading skeletons when true */
  loading: boolean;
  /** Pagination state managed by the parent */
  pagination: PaginationConfig;
  /** Called when the user clicks "تعديل" on a row */
  onEdit: (row: T) => void;
  /** Called when the user confirms deletion of a row */
  onDelete: (row: T) => void;
  /** Called when the user clicks a sortable column header */
  onSort: (field: keyof T, direction: 'asc' | 'desc') => void;
  /** Called when the user types in the search box */
  onSearch: (query: string) => void;
  /** Called when the user changes the page or rows-per-page */
  onPageChange: (page: number, pageSize: number) => void;
  /** Enable RTL layout (default: true — matches the app's global direction) */
  rtl?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Safely read a nested field value from a row object using dot-notation or a
 * plain key. Falls back to an empty string if the field is undefined.
 */
function getCellValue<T>(row: T, field: keyof T | string): React.ReactNode {
  const value = (row as Record<string, unknown>)[field as string];
  if (value === null || value === undefined) return '';
  return String(value);
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * DataTable — reusable generic table for the student management system.
 *
 * Features:
 * - Arabic UI (RTL) with all labels in Arabic
 * - Search input with Arabic placeholder
 * - Sortable column headers
 * - Edit / Delete action buttons per row
 * - Loading skeletons
 * - Empty state message
 * - Delete confirmation dialog
 * - MUI TablePagination
 *
 * @typeParam T - The shape of a data row object.
 */
export function DataTable<T extends object>({
  columns,
  data,
  loading,
  pagination,
  onEdit,
  onDelete,
  onSort,
  onSearch,
  onPageChange,
  rtl = true,
}: DataTableProps<T>) {
  // ── Local state ────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof T | string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<T | null>(null);

  // ── Search handler ─────────────────────────────────────────────────────────
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    onSearch(q);
  };

  // ── Sort handler ───────────────────────────────────────────────────────────
  const handleSortClick = (field: keyof T | string) => {
    const isAlreadySorted = sortField === field;
    const newDirection: 'asc' | 'desc' = isAlreadySorted && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    onSort(field as keyof T, newDirection);
  };

  // ── Delete dialog handlers ─────────────────────────────────────────────────
  const handleDeleteRequest = (row: T) => {
    setRowToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (rowToDelete !== null) {
      onDelete(rowToDelete);
    }
    setDeleteDialogOpen(false);
    setRowToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRowToDelete(null);
  };

  // ── Pagination handlers ────────────────────────────────────────────────────
  const handleChangePage = (_event: unknown, newPage: number) => {
    onPageChange(newPage, pagination.pageSize);
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPageChange(0, parseInt(e.target.value, 10));
  };

  // ── Skeleton rows for loading state ───────────────────────────────────────
  const skeletonRows = Array.from({ length: pagination.pageSize > 0 ? Math.min(pagination.pageSize, 5) : 5 });

  // ── Column count including actions column ──────────────────────────────────
  const totalColumns = columns.length + 1; // +1 for actions

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box dir={rtl ? 'rtl' : 'ltr'}>
      {/* Search Input */}
      <Box sx={{ mb: 2 }}>
        <TextField
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="بحث..."
          size="small"
          sx={{ minWidth: 280 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {/* Table */}
      <TableContainer component={Paper} elevation={1}>
        <Table size="small" aria-label="جدول البيانات">
          {/* Table Head */}
          <TableHead>
            <TableRow sx={{ backgroundColor: 'primary.main' }}>
              {columns.map((col) => (
                <TableCell
                  key={String(col.field)}
                  sx={{
                    color: 'primary.contrastText',
                    fontWeight: 700,
                    minWidth: col.minWidth,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <TableSortLabel
                    active={sortField === col.field}
                    direction={sortField === col.field ? sortDirection : 'asc'}
                    onClick={() => handleSortClick(col.field)}
                    sx={{
                      color: 'primary.contrastText !important',
                      '& .MuiTableSortLabel-icon': {
                        color: 'primary.contrastText !important',
                      },
                    }}
                  >
                    {col.headerName}
                  </TableSortLabel>
                </TableCell>
              ))}
              {/* Actions column */}
              <TableCell
                sx={{
                  color: 'primary.contrastText',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                }}
              >
                الإجراءات
              </TableCell>
            </TableRow>
          </TableHead>

          {/* Table Body */}
          <TableBody>
            {/* Loading state */}
            {loading && skeletonRows.map((_, idx) => (
              <TableRow key={`skeleton-${idx}`}>
                {Array.from({ length: totalColumns }).map((__, colIdx) => (
                  <TableCell key={`skeleton-cell-${colIdx}`}>
                    <Skeleton variant="text" animation="wave" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {/* Empty state */}
            {!loading && data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={totalColumns}
                  align="center"
                  sx={{ py: 6 }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={24} sx={{ display: 'none' }} />
                    <Typography variant="body1" color="text.secondary">
                      لا توجد بيانات
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}

            {/* Data rows */}
            {!loading && data.map((row, rowIdx) => (
              <TableRow
                key={rowIdx}
                hover
                sx={{
                  '&:nth-of-type(even)': { backgroundColor: 'action.hover' },
                }}
              >
                {columns.map((col) => (
                  <TableCell key={String(col.field)}>
                    {col.renderCell
                      ? col.renderCell(row)
                      : getCellValue(row, col.field)}
                  </TableCell>
                ))}

                {/* Action buttons */}
                <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={() => onEdit(row)}
                    sx={{ mr: 1, minWidth: 'auto' }}
                  >
                    تعديل
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteRequest(row)}
                    sx={{ minWidth: 'auto' }}
                  >
                    حذف
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={pagination.total}
          page={pagination.page}
          onPageChange={handleChangePage}
          rowsPerPage={pagination.pageSize}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage="صفوف في الصفحة:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} من ${count !== -1 ? count : `أكثر من ${to}`}`
          }
          sx={{ direction: 'rtl' }}
        />
      </TableContainer>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        dir={rtl ? 'rtl' : 'ltr'}
      >
        <DialogTitle id="delete-dialog-title">تأكيد الحذف</DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من الحذف؟ لا يمكن التراجع عن هذا الإجراء.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={handleDeleteCancel} variant="outlined" color="inherit">
            إلغاء
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error" autoFocus>
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DataTable;
