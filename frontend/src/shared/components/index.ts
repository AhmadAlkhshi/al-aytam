/**
 * Shared components barrel export.
 *
 * Import shared components from this file:
 * @example
 * import { DataTable, FormDialog } from '@/shared/components';
 */
export { DataTable, default as DataTableDefault } from './DataTable';
export type { } from './DataTable'; // re-export nothing extra — types live in shared/types

export { FormDialog, default as FormDialogDefault } from './FormDialog';
export type { FormDialogProps, FormField, SelectOption } from './FormDialog';
