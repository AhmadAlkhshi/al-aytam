import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import api, { ApiError, clearToken, getToken, setToken } from '../config/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  username: string;
  role: 'admin' | 'teacher' | 'viewer';
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  /** The currently authenticated user, or null if not logged in */
  user: AuthUser | null;
  /** True while an auth operation (login/logout/init) is in flight */
  isLoading: boolean;
  /** Shorthand: true when a valid token + user are present */
  isAuthenticated: boolean;
  /** Attempt login; throws ApiError on failure */
  login: (username: string, password: string) => Promise<void>;
  /** Clear the session and token */
  logout: () => void;
}

// ─── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ──────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider manages JWT-based authentication state.
 *
 * On mount it checks localStorage for an existing token and, if found,
 * fetches the current user from GET /api/auth/me to restore the session.
 * The raw token is stored in localStorage and attached to every Axios
 * request by the interceptor in `config/api.ts`.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // true until init completes

  // ── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Verify the stored token is still valid and fetch the user profile.
        // The interceptor in api.ts adds the Authorization header automatically.
        const response = await api.get<{ success: boolean; data: AuthUser }>(
          '/api/auth/me',
        );
        if (response.data.success && response.data.data) {
          setUser(response.data.data);
        } else {
          // Unexpected response shape — clear the stale token
          clearToken();
        }
      } catch {
        // 401 is handled by the api interceptor (clears token + redirects to /login).
        // Any other error: clear the token silently so the user sees the login page.
        clearToken();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void restore();
  }, []);

  // ── login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await api.post<{ success: boolean; data: LoginResponse }>(
        '/api/auth/login',
        { username, password },
      );

      const { token, user: loggedInUser } = response.data.data;
      setToken(token);
      setUser(loggedInUser);
    } catch (err) {
      // Re-throw so callers (e.g. LoginPage) can display the error message
      throw err instanceof ApiError
        ? err
        : new ApiError('فشل تسجيل الدخول. الرجاء المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback((): void => {
    clearToken();
    setUser(null);
    // Redirect to the login page
    window.location.href = '/login';
  }, []);

  // ── Context value (memoised to avoid unnecessary re-renders) ──────────────
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Access the authentication context.
 *
 * Must be used inside an <AuthProvider>.
 *
 * @example
 * const { isAuthenticated, user, login, logout } = useAuth();
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}

export default AuthContext;
