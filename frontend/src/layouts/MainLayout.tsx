import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  Divider,
  Avatar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ChecklistIcon from '@mui/icons-material/Checklist';
import GroupsIcon from '@mui/icons-material/Groups';
import SchoolIcon from '@mui/icons-material/School';
import { useAuth } from '../contexts/AuthContext';

// ─── Constants ─────────────────────────────────────────────────────────────────

const DRAWER_WIDTH = 240;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactElement;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'الجلسات',   path: '/sessions',   icon: <CalendarMonthIcon /> },
  { label: 'الطلاب',    path: '/students',   icon: <PeopleIcon /> },
  { label: 'النشاطات',  path: '/activities', icon: <FitnessCenterIcon /> },
  { label: 'النقاط',    path: '/points',     icon: <EmojiEventsIcon /> },
  { label: 'الحضور',    path: '/attendance', icon: <ChecklistIcon /> },
  { label: 'التقسيم',   path: '/division',   icon: <GroupsIcon /> },
];

// ─── Component ─────────────────────────────────────────────────────────────────

/**
 * MainLayout wraps all authenticated pages with:
 * - A top AppBar showing the system title and a logout button
 * - A collapsible side Drawer with navigation links
 * - A main content area that renders the matched child route via <Outlet>
 *
 * RTL is handled at the theme/RtlProvider level — this component simply uses
 * standard MUI layout primitives which honour the global RTL direction.
 */
export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const toggleDrawer = () => setDrawerOpen((prev) => !prev);

  // ── Drawer contents ────────────────────────────────────────────────────────

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Drawer header */}
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          px: 2,
        }}
      >
        <SchoolIcon color="primary" />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
          نظام إدارة الطلاب
        </Typography>
      </Toolbar>

      <Divider />

      {/* Navigation links */}
      <List component="nav" sx={{ flex: 1, pt: 1 }}>
        {NAV_ITEMS.map(({ label, path, icon }) => (
          <ListItemButton
            key={path}
            component={NavLink}
            to={path}
            sx={{
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              '&.active': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '& .MuiListItemIcon-root': {
                  color: 'primary.contrastText',
                },
              },
              '&:hover:not(.active)': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{icon}</ListItemIcon>
            <ListItemText primary={label} />
          </ListItemButton>
        ))}
      </List>

      <Divider />

      {/* Logged-in user info */}
      {user && (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
            {user.username.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {user.username}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user.role === 'admin'
                ? 'مدير'
                : user.role === 'teacher'
                ? 'معلم'
                : 'مشاهد'}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      {/* ── AppBar ── */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          width: drawerOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%',
          // In RTL the drawer is on the right, so margin goes to the right
          mr: drawerOpen ? `${DRAWER_WIDTH}px` : 0,
          transition: (t) =>
            t.transitions.create(['width', 'margin'], {
              easing: t.transitions.easing.sharp,
              duration: drawerOpen
                ? t.transitions.duration.enteringScreen
                : t.transitions.duration.leavingScreen,
            }),
        }}
      >
        <Toolbar>
          {/* Hamburger */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 'auto' }}
            aria-label={drawerOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          >
            <MenuIcon />
          </IconButton>

          {/* Title */}
          <Typography variant="h6" sx={{ fontWeight: 700, mx: 'auto' }}>
            نظام إدارة الطلاب
          </Typography>

          {/* Logout */}
          <Tooltip title="تسجيل الخروج">
            <IconButton color="inherit" onClick={handleLogout} aria-label="تسجيل الخروج">
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* ── Side Drawer ── */}
      <Drawer
        variant="persistent"
        anchor="right" // RTL: drawer on the right side
        open={drawerOpen}
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* ── Main content ── */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: '64px', // AppBar height
          minHeight: 'calc(100vh - 64px)',
          bgcolor: 'background.default',
          transition: (t) =>
            t.transitions.create('margin', {
              easing: t.transitions.easing.sharp,
              duration: drawerOpen
                ? t.transitions.duration.enteringScreen
                : t.transitions.duration.leavingScreen,
            }),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
