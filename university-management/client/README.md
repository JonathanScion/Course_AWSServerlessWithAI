# University Management System - Client

React frontend with Material-UI for the University Management System.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Application runs on http://localhost:3000

## Scripts

- `npm start` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (irreversible!)

## Features

### 15 Entity Pages

1. **Simple CRUD**
   - Departments
   - Buildings
   - Semesters

2. **Parent-Child Relationships**
   - Professors (linked to Departments)
   - Classrooms (linked to Buildings)
   - Students

3. **Multi-Level Hierarchy**
   - Courses (linked to Departments)
   - Sections (linked to Courses, Semesters, Professors)
   - Assignments (linked to Sections)
   - Grades (linked to Assignments and Students)

4. **Complex Relationships**
   - Enrollments (Students ↔ Sections)
   - Prerequisites (Courses ↔ Courses)
   - Class Schedules (Sections + Classrooms + Times)
   - Office Hours (Professors + Times)
   - Transcripts (Computed view of student data)

### UI Components

All pages use reusable Material-UI components:

- **DataTable** - Paginated table with sorting and actions
- **FormDialog** - Modal form for create/edit
- **ConfirmDialog** - Confirmation for delete actions
- **Notification** - Toast notifications for success/error
- **Layout** - Sidebar navigation with responsive drawer

## Project Structure

```
client/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── components/
│   │   ├── DataTable.js        # Reusable data table
│   │   ├── FormDialog.js       # Generic form modal
│   │   ├── ConfirmDialog.js    # Confirmation dialog
│   │   ├── Notification.js     # Toast notifications
│   │   └── Layout.js           # App layout with sidebar
│   ├── pages/
│   │   ├── Home.js             # Landing page
│   │   ├── CrudPage.js         # Generic CRUD page template
│   │   ├── pageConfigs.js      # Configuration for all entities
│   │   ├── Departments.js      # Example standalone page
│   │   ├── Transcripts.js      # Special read-only page
│   │   └── index.js            # Page exports
│   ├── services/
│   │   └── api.js              # API client and services
│   ├── hooks/
│   │   └── useCrud.js          # Custom hook for CRUD ops
│   ├── App.js                  # Main app with routing
│   └── index.js                # React entry point
├── package.json
└── README.md
```

## API Integration

The client communicates with the backend API at `http://localhost:5000`.

### API Service

All API calls go through `src/services/api.js`:

```javascript
import { departmentService } from './services/api';

// Get all
const response = await departmentService.getAll();

// Get by ID
const item = await departmentService.getById(1);

// Create
const newItem = await departmentService.create(data);

// Update
const updated = await departmentService.update(1, data);

// Delete
await departmentService.delete(1);
```

### Proxy Configuration

The `package.json` includes a proxy to the API server:

```json
{
  "proxy": "http://localhost:5000"
}
```

This allows the client to make requests to `/api/*` without CORS issues.

## Custom Hooks

### useCrud Hook

Simplifies CRUD operations with built-in state management:

```javascript
const {
  data,           // Current data
  loading,        // Loading state
  error,          // Error message
  page,           // Current page
  setPage,        // Change page
  rowsPerPage,    // Items per page
  setRowsPerPage, // Change items per page
  totalCount,     // Total items
  create,         // Create function
  update,         // Update function
  remove,         // Delete function
  refresh         // Refresh data
} = useCrud(departmentService);
```

## Styling

Uses Material-UI (MUI) v5 with:
- Default theme with primary color: `#1976d2`
- Responsive layout
- Mobile-friendly sidebar drawer
- Consistent spacing and typography

### Customizing Theme

Edit `src/App.js`:

```javascript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2'  // Change primary color
    },
    secondary: {
      main: '#dc004e'  // Change secondary color
    }
  }
});
```

## Page Patterns

### Generic CRUD Page

Most pages use the `CrudPage` component with configuration:

```javascript
// pages/Buildings.js
import CrudPage from './CrudPage';
import { buildingsConfig } from './pageConfigs';

const Buildings = () => {
  return <CrudPage {...buildingsConfig} />;
};
```

Configuration includes:
- Table columns
- Form fields
- Service reference
- Display name function

### Custom Pages

Some pages have custom implementations:
- **Departments** - Example of standalone page
- **Transcripts** - Read-only view with custom layout

## Form Field Types

The FormDialog component supports various field types:

```javascript
{
  name: 'fieldName',
  label: 'Field Label',
  type: 'text|email|number|select|date|checkbox',
  required: true,
  options: [...],      // For select fields
  multiline: true,     // For textareas
  rows: 3,             // For textareas
  fullWidth: true,     // Span full width
  inputProps: {...}    // HTML input attributes
}
```

## Navigation

Sidebar navigation is organized by entity type:
- Simple CRUD (collapsible)
- Parent-Child Relations (collapsible)
- Multi-Level Hierarchy (collapsible)
- Many-to-Many & Complex (collapsible)

## Responsive Design

- **Desktop (sm+)**: Permanent sidebar (280px wide)
- **Mobile (xs)**: Temporary drawer (opens on menu button)
- All tables support horizontal scrolling on small screens
- Forms adjust to single column on mobile

## Development

### Adding a New Entity

1. Add service to `src/services/api.js`:
   ```javascript
   export const myEntityService = createCrudService('/my-entity');
   ```

2. Add configuration to `src/pages/pageConfigs.js`:
   ```javascript
   export const myEntityConfig = {
     title: 'My Entities',
     service: myEntityService,
     columns: [...],
     formFields: [...]
   };
   ```

3. Create page in `src/pages/MyEntity.js`:
   ```javascript
   import CrudPage from './CrudPage';
   import { myEntityConfig } from './pageConfigs';

   export const MyEntity = () => <CrudPage {...myEntityConfig} />;
   ```

4. Add route to `src/App.js`:
   ```javascript
   <Route path="/my-entity" element={<MyEntity />} />
   ```

5. Add navigation item to `src/components/Layout.js`

### Environment Variables

Create `.env` file in client directory (optional):

```env
REACT_APP_API_URL=http://localhost:5000/api
```

If not set, defaults to proxy configuration.

## Building for Production

```bash
# Create optimized production build
npm run build

# Serve with static file server
npx serve -s build
```

The build folder is ready to deploy to:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting service

## Testing

Run tests (when implemented):

```bash
npm test
```

Potential test scenarios:
- Component rendering
- Form validation
- CRUD operations (mocked)
- Navigation
- Error handling

## Troubleshooting

### API calls fail with CORS errors
- Ensure server is running on port 5000
- Check package.json has proxy configuration
- Clear browser cache

### "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Changes don't appear
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Check console for errors

### Forms don't show dropdown options
- Some forms load options dynamically
- Ensure related entities exist in database
- Check browser console for API errors

## Dependencies

### Core
- **react** - UI library
- **react-dom** - React DOM rendering
- **react-router-dom** - Routing

### UI
- **@mui/material** - Material-UI components
- **@mui/icons-material** - Material-UI icons
- **@emotion/react** - CSS-in-JS (required by MUI)
- **@emotion/styled** - Styled components (required by MUI)
- **@mui/x-date-pickers** - Date picker components

### Utilities
- **axios** - HTTP client
- **date-fns** - Date formatting (for date pickers)

### Build
- **react-scripts** - Create React App build tools

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
