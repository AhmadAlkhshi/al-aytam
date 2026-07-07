/**
 * Smoke tests for main React components.
 *
 * Goal: verify each component mounts without crashing.
 * These are minimal render tests — not functional/integration tests.
 *
 * Strategy:
 *  - Mock the api module so no real HTTP requests are made.
 *  - Provide a stub AuthContext so useAuth() never throws.
 *  - Wrap components that need React Router in a MemoryRouter.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import * as Yup from 'yup';

// ─── Static imports for all components under test ─────────────────────────────
// (Static imports are resolved once at module load, avoiding per-test timeout.)
import LoginPage from '../pages/LoginPage';
import SessionsPage from '../pages/SessionsPage';
import StudentsPage from '../pages/StudentsPage';
import ActivitiesPage from '../pages/ActivitiesPage';
import PointsPage from '../pages/PointsPage';
import AttendancePage from '../pages/AttendancePage';
import DivisionPage from '../pages/DivisionPage';
import MainLayout from '../layouts/MainLayout';
import { DataTable } from '../shared/components/DataTable';
import { FormDialog } from '../shared/components/FormDialog';

// ─── Mock the api module (axios instance) ────────────────────────────────────
// All pages import `api` from '../config/api' and call api.get/post/put/delete.

vi.mock('../config/api', () => {
  const emptyListResponse = { data: { success: true, data: [], meta: { total: 0 } } };
  const emptyObjectResponse = { data: { success: true, data: {} } };

  const mockApi = {
    get: vi.fn(() => Promise.resolve(emptyListResponse)),
    post: vi.fn(() => Promise.resolve(emptyObjectResponse)),
    put: vi.fn(() => Promise.resolve(emptyObjectResponse)),
    delete: vi.fn(() => Promise.resolve({ data: { success: true } })),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };

  return {
    default: mockApi,
    ApiError: class ApiError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'ApiError';
      }
    },
    getToken: vi.fn(() => null),
    setToken: vi.fn(),
    clearToken: vi.fn(),
  };
});

// ─── Mock AuthContext ─────────────────────────────────────────────────────────

const mockAuthValue = {
  user: { id: '1', username: 'admin', role: 'admin' as const },
  isLoading: false,
  isAuthenticated: true,
  login: vi.fn(),
  logout: vi.fn(),
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthValue,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  default: null,
}));

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderInRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

// ─── Smoke Tests ─────────────────────────────────────────────────────────────

describe('Smoke tests — components render without crashing', () => {

  it('LoginPage renders', () => {
    // isAuthenticated = true → component renders a <Navigate> (still valid render, no crash)
    renderInRouter(<LoginPage />);
    expect(document.body).toBeInTheDocument();
  });

  it('SessionsPage renders', () => {
    renderInRouter(<SessionsPage />);
    expect(document.body).toBeInTheDocument();
  });

  it('StudentsPage renders', () => {
    renderInRouter(<StudentsPage />);
    expect(document.body).toBeInTheDocument();
  });

  it('ActivitiesPage renders', () => {
    renderInRouter(<ActivitiesPage />);
    expect(document.body).toBeInTheDocument();
  });

  it('PointsPage renders', () => {
    renderInRouter(<PointsPage />);
    expect(document.body).toBeInTheDocument();
  });

  it('AttendancePage renders', () => {
    renderInRouter(<AttendancePage />);
    expect(document.body).toBeInTheDocument();
  });

  it('DivisionPage renders', () => {
    renderInRouter(<DivisionPage />);
    expect(document.body).toBeInTheDocument();
  });

  it('MainLayout renders', () => {
    renderInRouter(<MainLayout />);
    expect(document.body).toBeInTheDocument();
  });

  it('DataTable renders with empty data', () => {
    type Row = { id: number };
    const columns = [{ field: 'id' as keyof Row, headerName: 'الرقم', minWidth: 80 }];
    render(
      <DataTable<Row>
        columns={columns}
        data={[]}
        loading={false}
        pagination={{ page: 0, pageSize: 10, total: 0 }}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onSort={vi.fn()}
        onSearch={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByText('لا توجد بيانات')).toBeInTheDocument();
  });

  it('FormDialog renders when open', () => {
    const schema = Yup.object({ name: Yup.string().required() });
    render(
      <FormDialog
        open={true}
        title="نافذة اختبار"
        fields={[{ name: 'name', label: 'الاسم', type: 'text', required: true }]}
        validationSchema={schema}
        onClose={vi.fn()}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
      />,
    );
    expect(screen.getByText('نافذة اختبار')).toBeInTheDocument();
  });

});
