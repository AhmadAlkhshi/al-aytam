import { createTheme } from '@mui/material/styles';

/**
 * Material-UI theme with full RTL support for Arabic interface
 *
 * Configuration:
 * - direction: 'rtl' for proper RTL layout in all MUI components
 * - Arabic-optimized typography using Cairo font (Google Fonts)
 * - Custom color palette suitable for the application
 * - Component overrides for RTL compatibility
 *
 * RTL rendering is handled at the CSS level via the RtlProvider (Emotion cache
 * with stylis-plugin-rtl), which automatically mirrors layout properties like
 * margin-left → margin-right, padding-right → padding-left, etc.
 */
export const theme = createTheme({
  direction: 'rtl',

  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2',
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f',
      light: '#ef5350',
      dark: '#c62828',
    },
    warning: {
      main: '#ed6c02',
      light: '#ff9800',
      dark: '#e65100',
    },
    success: {
      main: '#2e7d32',
      light: '#4caf50',
      dark: '#1b5e20',
    },
    info: {
      main: '#0288d1',
      light: '#03a9f4',
      dark: '#01579b',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },

  typography: {
    // Cairo is a Google Font designed for Arabic + Latin — clean and highly legible
    // Tajawal is listed as a secondary fallback (also Arabic-optimized)
    // Then system Arabic fonts, then generic sans-serif
    fontFamily: [
      'Cairo',
      'Tajawal',
      'Segoe UI',
      'Tahoma',
      'Arial',
      'sans-serif',
    ].join(','),

    fontSize: 14,

    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.35,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.7, // Slightly more generous line height for Arabic readability
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
  },

  shape: {
    borderRadius: 8,
  },

  spacing: 8, // 8px base spacing unit

  components: {
    // Ensure body direction is RTL
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          direction: 'rtl',
        },
        // Import Cairo from Google Fonts via @font-face is handled in index.html
        // so fonts load before JS
      },
    },

    // Prevent text-transform on Arabic buttons (uppercase breaks Arabic)
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },

    // Ensure icon buttons have correct RTL padding
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },

    // TextField — ensure labels and text align correctly in RTL
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },

    // Table cells should respect RTL text alignment
    MuiTableCell: {
      styleOverrides: {
        root: {
          textAlign: 'right',
        },
        head: {
          fontWeight: 700,
        },
      },
    },

    // Paper elevation styling
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 8,
        },
      },
    },

    // Drawer opens from the right in RTL
    MuiDrawer: {
      defaultProps: {
        anchor: 'right',
      },
    },

    // Snackbar anchored to bottom-left in RTL (equivalent of bottom-right in LTR)
    MuiSnackbar: {
      defaultProps: {
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'left',
        },
      },
    },

    // Chip text should not be transformed
    MuiChip: {
      styleOverrides: {
        label: {
          fontFamily: 'Cairo, Tajawal, Tahoma, sans-serif',
        },
      },
    },
  },
});

export default theme;
