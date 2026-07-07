import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../config/api';

/**
 * LoginPage — صفحة تسجيل الدخول
 *
 * Displays a centered login card with Arabic labels and RTL layout.
 * On successful login the user is redirected to their original destination
 * (preserved in router state by ProtectedRoute) or to /sessions as a fallback.
 */
export default function LoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Determine where to redirect after login
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/sessions';

  // If auth is still initialising, show a spinner so we don't flash the login
  // page for an already-authenticated user
  if (authLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Already logged in — go straight to the app
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('الرجاء إدخال اسم المستخدم وكلمة المرور.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('فشل تسجيل الدخول. الرجاء المحاولة مرة أخرى.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box
      component="main"
      dir="rtl"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Card
        elevation={4}
        sx={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* ── Title ── */}
          <Typography
            variant="h4"
            component="h1"
            align="center"
            gutterBottom
            sx={{ mb: 3, fontWeight: 700, color: 'primary.main' }}
          >
            تسجيل الدخول
          </Typography>

          {/* ── Error alert ── */}
          {errorMessage && (
            <Alert
              severity="error"
              sx={{ mb: 2, textAlign: 'right' }}
              onClose={() => setErrorMessage(null)}
            >
              {errorMessage}
            </Alert>
          )}

          {/* ── Form ── */}
          <Box
            component="form"
            onSubmit={(e) => { void handleSubmit(e); }}
            noValidate
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            {/* Username */}
            <TextField
              id="username"
              label="اسم المستخدم"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              fullWidth
              required
              disabled={isSubmitting}
              slotProps={{ htmlInput: { dir: 'ltr' } }}
            />

            {/* Password */}
            <TextField
              id="password"
              label="كلمة المرور"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              fullWidth
              required
              disabled={isSubmitting}
              slotProps={{
                htmlInput: { dir: 'ltr' },
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        onClick={togglePasswordVisibility}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* Submit button */}
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting}
              sx={{ mt: 1, py: 1.4, fontSize: '1rem', fontWeight: 700 }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'دخول'
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
