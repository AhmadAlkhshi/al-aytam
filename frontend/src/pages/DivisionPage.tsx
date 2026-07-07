import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import type { ApiResponse } from '../config/api';
import api from '../config/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Session {
  id: number;
  sessionNumber: number;
  sessionDate: string;
}

interface StudentInfo {
  id: number;
  firstName: string;
  lastName: string;
  guardianName: string;
  age: number;
}

interface Group {
  groupNumber: number;
  students: StudentInfo[];
  count: number;
}

interface Category {
  name: string;
  students: StudentInfo[];
  groups: Group[];
  count: number;
}

interface DivisionResult {
  sessionId: number;
  totalStudents: number;
  categories: Category[];
  message?: string;
}

// ─── Colour palette for groups ─────────────────────────────────────────────────

const GROUP_COLOURS = [
  '#1976d2', // blue
  '#388e3c', // green
  '#f57c00', // orange
  '#7b1fa2', // purple
  '#c62828', // red
];

function groupColour(index: number): string {
  return GROUP_COLOURS[index % GROUP_COLOURS.length] ?? '#1976d2';
}

// ─── Sub-components ────────────────────────────────────────────────────────────

/**
 * Renders a single group card showing student names.
 */
function GroupCard({ group, colourIndex }: { group: Group; colourIndex: number }) {
  const colour = groupColour(colourIndex);
  return (
    <Card
      variant="outlined"
      sx={{
        borderTop: `4px solid ${colour}`,
        flex: '1 1 200px',
        minWidth: 180,
      }}
    >
      <CardHeader
        title={
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colour }}>
            المجموعة {group.groupNumber}
          </Typography>
        }
        subheader={
          <Typography variant="caption" color="text.secondary">
            {group.count} طالب
          </Typography>
        }
        sx={{ pb: 0 }}
      />
      <CardContent sx={{ pt: 1 }}>
        <Stack spacing={0.5}>
          {group.students.map((s) => (
            <Typography key={s.id} variant="body2">
              {s.firstName} {s.lastName}
            </Typography>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

/**
 * Renders one category (أ or ب) with all its groups.
 */
function CategorySection({ category }: { category: Category }) {
  const isCategoryA = category.name === 'أ';
  const headerBg = isCategoryA ? 'primary.main' : 'secondary.main';

  return (
    <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden' }}>
      {/* Category header */}
      <Box
        sx={{
          bgcolor: headerBg,
          color: 'white',
          px: 3,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <GroupsIcon />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          الفئة ({category.name})
        </Typography>
        <Chip
          label={`${category.count} طالب`}
          size="small"
          sx={{ mr: 'auto', bgcolor: 'rgba(255,255,255,0.25)', color: 'white' }}
        />
      </Box>

      {/* Groups grid */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {category.groups.map((group, idx) => (
            <GroupCard key={group.groupNumber} group={group} colourIndex={idx} />
          ))}
        </Box>
      </Box>
    </Paper>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

/**
 * DivisionPage — Requirement 4.9.1 / Requirements 5, 6, 13
 *
 * Allows the user to:
 *  1. Pick a session from the dropdown.
 *  2. Click "احسب التقسيم" to call POST /api/division/calculate.
 *  3. View the division results: total count, categories (أ / ب), and groups.
 *
 * Edge cases handled:
 *  - No sessions available
 *  - No present students (0 students)
 *  - < 15 students → single category
 *  - 15–36 students → two categories
 *  - > 36 students → warning message + single category
 */
export default function DivisionPage() {
  // ── Session list ─────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // ── Selection ─────────────────────────────────────────────────────────────
  const [selectedSessionId, setSelectedSessionId] = useState<number | ''>('');

  // ── Division result ───────────────────────────────────────────────────────
  const [result, setResult] = useState<DivisionResult | null>(null);
  const [calculating, setCalculating] = useState(false);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning';
  }>({ open: false, message: '', severity: 'success' });

  // ── Load sessions ─────────────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await api.get<ApiResponse<Session[]>>('/api/sessions', {
        params: { page: 1, limit: 200 },
      });
      if (res.data.success && res.data.data) {
        const sorted = [...res.data.data].sort(
          (a, b) => b.sessionNumber - a.sessionNumber,
        );
        setSessions(sorted);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تحميل قائمة الجلسات';
      showToast(msg, 'error');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const showToast = (
    message: string,
    severity: 'success' | 'error' | 'warning',
  ) => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast((prev) => ({ ...prev, open: false }));
  };

  const handleSessionChange = (e: SelectChangeEvent<number | ''>) => {
    setSelectedSessionId(e.target.value as number | '');
    setResult(null); // clear previous result when session changes
  };

  const handleCalculate = async () => {
    if (selectedSessionId === '') return;

    setCalculating(true);
    setResult(null);
    try {
      const res = await api.post<ApiResponse<DivisionResult>>(
        '/api/division/calculate',
        { session_id: selectedSessionId },
      );
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        setResult(data);

        if (data.totalStudents === 0) {
          showToast('لا يوجد طلاب حاضرون في هذه الجلسة', 'warning');
        } else if (data.message) {
          showToast(data.message, 'warning');
        } else {
          showToast('تم احتساب التقسيم بنجاح', 'success');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل احتساب التقسيم';
      showToast(msg, 'error');
    } finally {
      setCalculating(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  const formatSessionLabel = (s: Session): string => {
    const date = String(s.sessionDate).split('T')[0];
    const [year, month, day] = date.split('-');
    return `جلسة ${s.sessionNumber} — ${day}/${month}/${year}`;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Container maxWidth="lg" dir="rtl">
      {/* Page title */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
          تقسيم الطلاب
        </Typography>
        <Typography variant="body2" color="text.secondary">
          اختر جلسة لعرض توزيع الطلاب الحاضرين إلى فئات ومجموعات
        </Typography>
      </Box>

      {/* Session selector card */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            alignItems: { xs: 'stretch', sm: 'center' },
          }}
        >
          <FormControl sx={{ minWidth: 280 }} size="small">
            <InputLabel id="session-select-label">اختر الجلسة</InputLabel>
            <Select
              labelId="session-select-label"
              id="session-select"
              value={selectedSessionId}
              label="اختر الجلسة"
              onChange={handleSessionChange}
              disabled={sessionsLoading}
            >
              {sessions.map((s) => (
                <MenuItem key={s.id} value={s.id}>
                  {formatSessionLabel(s)}
                </MenuItem>
              ))}
              {sessions.length === 0 && !sessionsLoading && (
                <MenuItem disabled value="">
                  لا توجد جلسات مسجّلة
                </MenuItem>
              )}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            startIcon={
              calculating ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <ShuffleIcon />
              )
            }
            onClick={() => void handleCalculate()}
            disabled={selectedSessionId === '' || calculating}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {calculating ? 'جارٍ الحساب…' : 'احسب التقسيم'}
          </Button>
        </Box>
      </Paper>

      {/* ── Results ─────────────────────────────────────────────────────── */}

      {result && (
        <>
          {/* Summary bar */}
          <Paper
            elevation={0}
            sx={{
              bgcolor: 'primary.50',
              border: '1px solid',
              borderColor: 'primary.200',
              borderRadius: 2,
              px: 3,
              py: 2,
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <PeopleAltIcon color="primary" />
            <Typography sx={{ fontWeight: 700 }}>
              إجمالي الطلاب الحاضرين:
            </Typography>
            <Chip
              label={result.totalStudents}
              color="primary"
              size="small"
              sx={{ fontWeight: 700, fontSize: '1rem', px: 1 }}
            />

            {result.categories.length > 0 && (
              <>
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                {result.categories.map((cat) => (
                  <Box
                    key={cat.name}
                    sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      فئة {cat.name}:
                    </Typography>
                    <Chip label={cat.count} size="small" variant="outlined" />
                  </Box>
                ))}
              </>
            )}
          </Paper>

          {/* Warning / info message from backend */}
          {result.message && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {result.message}
            </Alert>
          )}

          {/* No students present */}
          {result.totalStudents === 0 && (
            <Alert severity="info">
              لا يوجد طلاب حاضرون في هذه الجلسة. يُرجى تسجيل الحضور أولاً.
            </Alert>
          )}

          {/* Category + group cards */}
          {result.categories.map((cat) => (
            <CategorySection key={cat.name} category={cat} />
          ))}
        </>
      )}

      {/* Empty state when no calculation has been done yet */}
      {!result && !calculating && (
        <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
          <GroupsIcon sx={{ fontSize: 64, mb: 2, opacity: 0.3 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }} gutterBottom>
            لم يتم احتساب أي تقسيم بعد
          </Typography>
          <Typography variant="body2">
            اختر جلسة من القائمة أعلاه ثم اضغط على زر "احسب التقسيم"
          </Typography>
        </Box>
      )}

      {/* Toast notifications */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
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
