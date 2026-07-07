import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

/**
 * Axios client configuration for the student management system API.
 *
 * Features:
 * - Base URL from VITE_API_URL environment variable
 * - Request interceptor: attaches JWT token from localStorage to every request
 * - Response interceptor: centralized error handling with Arabic error messages
 * - 401 handling: clears token and redirects to login page
 */

// ─── API Response Types ────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// ─── Error Classes ─────────────────────────────────────────────────────────────

export class ApiError extends Error {
  public readonly status?: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    status?: number,
    code?: string,
    details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// ─── Token Helpers ─────────────────────────────────────────────────────────────

const TOKEN_KEY = 'access_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

// ─── Axios Instance ────────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request Interceptor ───────────────────────────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ─── Response Interceptor ─────────────────────────────────────────────────────

api.interceptors.response.use(
  // Pass successful responses through unchanged
  (response) => response,

  // Handle error responses with Arabic messages
  (error: AxiosError<ApiResponse>) => {
    if (error.response) {
      const { status, data } = error.response;

      // Use the server's own message if provided, otherwise fall back to defaults
      const serverMessage = data?.error?.message;
      const serverCode = data?.error?.code;
      const serverDetails = data?.error?.details;

      switch (status) {
        case 400:
          return Promise.reject(
            new ApiError(
              serverMessage ?? 'طلب غير صالح.',
              status,
              serverCode ?? 'BAD_REQUEST',
              serverDetails,
            ),
          );

        case 401:
          // Clear the stored token and redirect to login
          clearToken();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(
            new ApiError(
              'انتهت صلاحية الجلسة. الرجاء تسجيل الدخول مرة أخرى.',
              status,
              serverCode ?? 'AUTHENTICATION_ERROR',
            ),
          );

        case 403:
          return Promise.reject(
            new ApiError(
              'ليس لديك صلاحية للقيام بهذا الإجراء.',
              status,
              serverCode ?? 'AUTHORIZATION_ERROR',
            ),
          );

        case 404:
          return Promise.reject(
            new ApiError(
              'البيانات المطلوبة غير موجودة.',
              status,
              serverCode ?? 'NOT_FOUND',
            ),
          );

        case 422:
          return Promise.reject(
            new ApiError(
              serverMessage ?? 'البيانات المدخلة غير صحيحة.',
              status,
              serverCode ?? 'VALIDATION_ERROR',
              serverDetails,
            ),
          );

        case 500:
        default:
          return Promise.reject(
            new ApiError(
              'حدث خطأ في الخادم. الرجاء المحاولة لاحقاً.',
              status,
              serverCode ?? 'INTERNAL_SERVER_ERROR',
            ),
          );
      }
    }

    if (error.request) {
      // Request was sent but no response was received (network / CORS issue)
      return Promise.reject(
        new ApiError(
          'تعذر الاتصال بالخادم. الرجاء التحقق من اتصال الإنترنت.',
          undefined,
          'NETWORK_ERROR',
        ),
      );
    }

    // Something else happened while setting up the request
    return Promise.reject(
      new ApiError(
        error.message ?? 'حدث خطأ غير متوقع.',
        undefined,
        'CLIENT_ERROR',
      ),
    );
  },
);

export default api;
