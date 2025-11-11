# How to Run E2E Tests

## ⚠️ Critical: You MUST Start Both Servers First!

E2E tests require both the backend server and frontend client to be running. Tests will **timeout and fail** if either is missing.

---

## Quick Start (3 Terminals)

### Terminal 1: Start Backend Server
```bash
cd university-management/server
npm run dev
```

**✅ Success looks like:**
```
Server running on http://localhost:5000
API endpoints available at http://localhost:5000/api
Health check: http://localhost:5000/health
```

**❌ If you see errors:**
- Database connection error → Check PostgreSQL is running
- Port in use → Kill process on port 5000
- Module not found → Run `npm install`

---

### Terminal 2: Start Frontend Client
```bash
cd university-management/client
npm start
```

**✅ Success looks like:**
```
webpack compiled successfully
Compiled successfully!

You can now view university-management-client in the browser.

  Local:            http://localhost:3000
```

**❌ If you see errors:**
- Port in use → Kill process on port 3000
- Module not found → Run `npm install`

---

### Terminal 3: Run Tests
```bash
cd university-management
npm test
```

**Available test commands:**
```bash
npm test                # Run all tests (headless)
npm run test:ui         # Interactive UI mode (RECOMMENDED)
npm run test:headed     # See browser while testing
npm run test:debug      # Debug with Playwright Inspector
npm run test:departments # Run only departments tests
npm run test:report     # View HTML report
```

---

## Pre-Flight Check

Run the pre-flight check test first to verify everything is set up:

```bash
npm test -- --grep="PRE-FLIGHT"
```

**This will check:**
- ✅ Server is running on http://localhost:5000
- ✅ Client is running on http://localhost:3000
- ✅ API endpoint /api/departments is accessible

**If any check fails**, you'll get a clear error message telling you what to fix.

---

## Common Issues

### Issue 1: "Test timeout of 10000ms exceeded"

**Cause:** Server or client not running

**Fix:**
1. Check Terminal 1 - is server running?
2. Check Terminal 2 - is client running?
3. Try accessing manually:
   - http://localhost:5000/health (should return JSON)
   - http://localhost:3000 (should show the app)

---

### Issue 2: "Cannot connect to database"

**Cause:** PostgreSQL not running or wrong connection string

**Fix:**
```bash
# Check if PostgreSQL is running
# Windows:
services.msc  # Look for PostgreSQL service

# Mac:
brew services list

# Linux:
sudo systemctl status postgresql

# Check your .env file in server/
# Should have:
DATABASE_URL="postgresql://user:password@localhost:5432/university_management"
```

---

### Issue 3: "Port 3000/5000 already in use"

**Cause:** Another process is using the port

**Fix:**
```bash
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

---

### Issue 4: Database not initialized

**Cause:** Prisma migrations not run

**Fix:**
```bash
cd university-management/server
npx prisma migrate dev
npx prisma db seed  # Optional: add sample data
```

---

## Test Execution Flow

```
┌─────────────────────────────────────────┐
│  1. Start PostgreSQL Database           │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│  2. Start Backend Server (Terminal 1)   │
│     cd server && npm run dev             │
│     → Listening on http://localhost:5000 │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│  3. Start Frontend Client (Terminal 2)  │
│     cd client && npm start               │
│     → Listening on http://localhost:3000 │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│  4. Run Tests (Terminal 3)               │
│     cd university-management && npm test │
│     → Playwright tests both servers      │
└──────────────────────────────────────────┘
```

---

## Debugging Failed Tests

### 1. Run Pre-Flight Check
```bash
npm test -- --grep="PRE-FLIGHT"
```

### 2. Run in UI Mode
```bash
npm run test:ui
```
- See tests run interactively
- Pause and inspect at any step
- View network requests

### 3. Run in Headed Mode
```bash
npm run test:headed
```
- See actual browser
- Watch what the test is doing

### 4. Check Server Logs
- Look at Terminal 1 (server logs)
- Check for API errors
- Verify database queries

### 5. Check Client Console
In headed mode:
- Open browser DevTools
- Check Console for errors
- Check Network tab for failed requests

---

## CI/CD Integration

For automated testing (GitHub Actions, etc.):

```yaml
- name: Start PostgreSQL
  run: # Your DB setup

- name: Start Backend
  run: |
    cd server
    npm install
    npm run dev &
    sleep 10  # Wait for server to start

- name: Start Frontend
  run: |
    cd client
    npm install
    npm start &
    sleep 30  # Wait for webpack to compile

- name: Run Tests
  run: |
    cd university-management
    npm install
    npx playwright install --with-deps chromium
    npm test
```

---

## Quick Checklist

Before running tests, verify:

- [ ] PostgreSQL is running
- [ ] Terminal 1: Server running on http://localhost:5000
- [ ] Terminal 2: Client running on http://localhost:3000
- [ ] Terminal 3: Ready to run `npm test`
- [ ] Can access http://localhost:3000 in browser
- [ ] Can access http://localhost:5000/health in browser

If all checked ✅, run:
```bash
npm test
```

---

## Getting Help

If tests still fail after following this guide:

1. **Run pre-flight check** and share the error
2. **Check server logs** in Terminal 1
3. **Try manual testing** - can you create a department in the UI?
4. **Check database** - is it accessible and seeded?
5. **Review TESTING_LESSONS_LEARNED.md** for common issues

---

**Last Updated:** 2025-01-11
