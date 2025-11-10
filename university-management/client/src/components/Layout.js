import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Collapse
} from '@mui/material';
import {
  Menu as MenuIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  MeetingRoom as MeetingRoomIcon,
  People as PeopleIcon,
  Book as BookIcon,
  Class as ClassIcon,
  Assignment as AssignmentIcon,
  Grade as GradeIcon,
  PersonAdd as EnrollmentIcon,
  Link as LinkIcon,
  Schedule as ScheduleIcon,
  AccessTime as TimeIcon,
  Description as TranscriptIcon,
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

const menuItems = [
  {
    title: 'Simple CRUD',
    items: [
      { text: 'Departments', icon: <BusinessIcon />, path: '/departments' },
      { text: 'Buildings', icon: <SchoolIcon />, path: '/buildings' },
      { text: 'Semesters', icon: <CalendarIcon />, path: '/semesters' }
    ]
  },
  {
    title: 'Parent-Child Relations',
    items: [
      { text: 'Professors', icon: <PersonIcon />, path: '/professors' },
      { text: 'Classrooms', icon: <MeetingRoomIcon />, path: '/classrooms' },
      { text: 'Students', icon: <PeopleIcon />, path: '/students' }
    ]
  },
  {
    title: 'Multi-Level Hierarchy',
    items: [
      { text: 'Courses', icon: <BookIcon />, path: '/courses' },
      { text: 'Sections', icon: <ClassIcon />, path: '/sections' },
      { text: 'Assignments', icon: <AssignmentIcon />, path: '/assignments' },
      { text: 'Grades', icon: <GradeIcon />, path: '/grades' }
    ]
  },
  {
    title: 'Many-to-Many & Complex',
    items: [
      { text: 'Enrollments', icon: <EnrollmentIcon />, path: '/enrollments' },
      { text: 'Prerequisites', icon: <LinkIcon />, path: '/prerequisites' },
      { text: 'Class Schedules', icon: <ScheduleIcon />, path: '/schedules' },
      { text: 'Office Hours', icon: <TimeIcon />, path: '/office-hours' },
      { text: 'Transcripts', icon: <TranscriptIcon />, path: '/transcripts' }
    ]
  }
];

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState({});
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleSection = (title) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          University System
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((section) => (
          <React.Fragment key={section.title}>
            <ListItemButton onClick={() => toggleSection(section.title)}>
              <ListItemText
                primary={section.title}
                primaryTypographyProps={{ fontWeight: 'bold', fontSize: '0.875rem' }}
              />
              {openSections[section.title] ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
            <Collapse in={openSections[section.title]} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {section.items.map((item) => (
                  <ListItem key={item.path} disablePadding>
                    <ListItemButton
                      sx={{ pl: 4 }}
                      selected={location.pathname === item.path}
                      onClick={() => {
                        navigate(item.path);
                        setMobileOpen(false);
                      }}
                    >
                      <ListItemIcon>{item.icon}</ListItemIcon>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </React.Fragment>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` }
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            University Management System
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` }
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
