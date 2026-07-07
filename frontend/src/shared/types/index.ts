/**
 * Shared TypeScript types for the student management system.
 *
 * These types are used across all feature pages to ensure consistency
 * in component props and data structures.
 */

// ─── DataTable Types ────────────────────────────────────────────────────────

/**
 * Defines a single column in the DataTable.
 *
 * @typeParam T - The shape of a data row object.
 */
export interface Column<T> {
  /** Unique identifier / field key for this column */
  field: keyof T | string;
  /** Arabic label displayed in the table header */
  headerName: string;
  /** Optional minimum width in pixels */
  minWidth?: number;
  /** Optional flex grow factor */
  flex?: number;
  /** Optional custom renderer — receives the full row and returns a React node */
  renderCell?: (row: T) => React.ReactNode;
}

/**
 * Pagination configuration passed to the DataTable.
 */
export interface PaginationConfig {
  /** Current page index (0-based) */
  page: number;
  /** Number of rows per page */
  pageSize: number;
  /** Total number of rows across all pages */
  total: number;
}
