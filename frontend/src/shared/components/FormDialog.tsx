import { useEffect } from 'react';
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
  Typography,
  Divider,
  FormControlLabel,
  Checkbox,
  FormControl,
  FormHelperText,
  FormGroup,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as Yup from 'yup';

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A single option for a select/dropdown field.
 */
export interface SelectOption {
  value: string | number;
  label: string;
}

/**
 * Describes one field rendered inside the FormDialog.
 */
export interface FormField {
  /** Unique key — used as the form state key and the input's name */
  name: string;
  /** Arabic label displayed above the input */
  label: string;
  /** Input type */
  type: 'text' | 'number' | 'select' | 'textarea' | 'date' | 'checkbox';
  /** Required field */
  required?: boolean;
  /** Options for "select" type fields */
  options?: SelectOption[];
  /** Placeholder text */
  placeholder?: string;
  /** Minimum value for "number" type */
  min?: number;
  /** Maximum value for "number" type */
  max?: number;
  /** Number of rows for "textarea" type (default: 3) */
  rows?: number;
}

/**
 * Props for the FormDialog component.
 */
export interface FormDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Arabic title shown in the dialog header */
  title: string;
  /** Called when the user closes the dialog (cancel / backdrop click) */
  onClose: () => void;
  /**
   * Called when the user submits the form.
   * Receives the current form data object.
   * Should return a Promise — while pending the submit button shows a spinner.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => Promise<void>;
  /** Array of field configurations to render */
  fields: FormField[];
  /** Pre-filled values for edit mode. Keys match `FormField.name`. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialValues?: any;
  /** Yup validation schema — validates the form before submitting */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validationSchema: Yup.ObjectSchema<any>;
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * FormDialog — reusable modal form dialog for the student management system.
 *
 * Features:
 * - Arabic UI (RTL) with all labels/buttons in Arabic
 * - Driven by a `fields` config — no hard-coded form fields
 * - Supports: text, number, select, textarea, date, checkbox inputs
 * - Validation via Yup schema passed as prop — error messages in Arabic
 * - React Hook Form manages form state
 * - Loading spinner on the submit button while awaiting `onSubmit`
 * - Resets form state when opened / closed
 * - "حفظ" (Save) and "إلغاء" (Cancel) buttons
 */
export function FormDialog({
  open,
  title,
  onClose,
  onSubmit,
  fields,
  initialValues,
  validationSchema,
}: FormDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: initialValues ?? {},
  });

  // Reset form when dialog opens with new initialValues
  useEffect(() => {
    if (open) {
      reset(initialValues ?? {});
    }
  }, [open, initialValues, reset]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleFormSubmit = handleSubmit(async (data) => {
    try {
      await onSubmit(data);
      // Parent is responsible for closing the dialog on success
    } catch {
      // Errors should be handled by the parent (e.g. toast notification)
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
      aria-labelledby="form-dialog-title"
      onKeyDown={(e) => {
        if (isSubmitting && e.key === 'Escape') e.stopPropagation();
      }}
    >
      {/* Header */}
      <DialogTitle
        id="form-dialog-title"
        sx={{
          fontWeight: 700,
          fontSize: '1.15rem',
          pb: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {title}
      </DialogTitle>

      <Divider />

      {/* Form Fields */}
      <DialogContent sx={{ pt: 2, pb: 1 }}>
        <Box
          component="form"
          noValidate
          autoComplete="off"
          onSubmit={handleFormSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          {fields.map((field) => {
            const errorMsg = (errors[field.name]?.message as string | undefined) ?? null;
            const hasError = Boolean(errorMsg);

            // ── Checkbox ──────────────────────────────────────────────────
            if (field.type === 'checkbox') {
              return (
                <Controller
                  key={field.name}
                  name={field.name}
                  control={control}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <FormControl error={hasError} component="fieldset">
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={Boolean(value)}
                              onChange={(e) => onChange(e.target.checked)}
                              onBlur={onBlur}
                              disabled={isSubmitting}
                            />
                          }
                          label={
                            <Typography variant="body2">
                              {field.label}
                              {field.required && (
                                <Typography
                                  component="span"
                                  color="error"
                                  sx={{ mr: 0.5 }}
                                >
                                  *
                                </Typography>
                              )}
                            </Typography>
                          }
                        />
                      </FormGroup>
                      {hasError && (
                        <FormHelperText>{errorMsg}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              );
            }

            // ── Select ──────────────────────────────────────────────────────
            if (field.type === 'select') {
              return (
                <Controller
                  key={field.name}
                  name={field.name}
                  control={control}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextField
                      select
                      label={field.label}
                      required={field.required}
                      error={hasError}
                      helperText={
                        hasError ? (
                          <Typography component="span" variant="caption" color="error">
                            {errorMsg}
                          </Typography>
                        ) : undefined
                      }
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                      value={String(value ?? '')}
                      onChange={onChange}
                      onBlur={onBlur}
                    >
                      {(field.options ?? []).map((opt) => (
                        <MenuItem key={String(opt.value)} value={String(opt.value)}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              );
            }

            // ── Textarea ────────────────────────────────────────────────────
            if (field.type === 'textarea') {
              return (
                <Controller
                  key={field.name}
                  name={field.name}
                  control={control}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextField
                      multiline
                      rows={field.rows ?? 3}
                      label={field.label}
                      required={field.required}
                      error={hasError}
                      helperText={
                        hasError ? (
                          <Typography component="span" variant="caption" color="error">
                            {errorMsg}
                          </Typography>
                        ) : undefined
                      }
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                      value={String(value ?? '')}
                      onChange={onChange}
                      onBlur={onBlur}
                      placeholder={field.placeholder}
                    />
                  )}
                />
              );
            }

            // ── Date ────────────────────────────────────────────────────────
            if (field.type === 'date') {
              return (
                <Controller
                  key={field.name}
                  name={field.name}
                  control={control}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextField
                      type="date"
                      label={field.label}
                      required={field.required}
                      error={hasError}
                      helperText={
                        hasError ? (
                          <Typography component="span" variant="caption" color="error">
                            {errorMsg}
                          </Typography>
                        ) : undefined
                      }
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                      value={String(value ?? '')}
                      onChange={onChange}
                      onBlur={onBlur}
                      slotProps={{
                        inputLabel: { shrink: true },
                      }}
                    />
                  )}
                />
              );
            }

            // ── Number ──────────────────────────────────────────────────────
            if (field.type === 'number') {
              return (
                <Controller
                  key={field.name}
                  name={field.name}
                  control={control}
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextField
                      type="number"
                      label={field.label}
                      required={field.required}
                      error={hasError}
                      helperText={
                        hasError ? (
                          <Typography component="span" variant="caption" color="error">
                            {errorMsg}
                          </Typography>
                        ) : undefined
                      }
                      fullWidth
                      size="small"
                      disabled={isSubmitting}
                      value={String(value ?? '')}
                      onChange={onChange}
                      onBlur={onBlur}
                      placeholder={field.placeholder}
                      slotProps={{
                        htmlInput: {
                          min: field.min,
                          max: field.max,
                        },
                      }}
                    />
                  )}
                />
              );
            }

            // ── Text (default) ──────────────────────────────────────────────
            return (
              <Controller
                key={field.name}
                name={field.name}
                control={control}
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextField
                    type="text"
                    label={field.label}
                    required={field.required}
                    error={hasError}
                    helperText={
                      hasError ? (
                        <Typography component="span" variant="caption" color="error">
                          {errorMsg}
                        </Typography>
                      ) : undefined
                    }
                    fullWidth
                    size="small"
                    disabled={isSubmitting}
                    value={String(value ?? '')}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder={field.placeholder}
                  />
                )}
              />
            );
          })}
        </Box>
      </DialogContent>

      <Divider />

      {/* Actions */}
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {/* Cancel */}
        <Button
          onClick={handleClose}
          variant="outlined"
          color="inherit"
          disabled={isSubmitting}
          startIcon={<CloseIcon />}
        >
          إلغاء
        </Button>

        {/* Submit */}
        <Button
          onClick={handleFormSubmit}
          variant="contained"
          color="primary"
          disabled={isSubmitting}
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

export default FormDialog;
