# RelateMe — Full-Stack Setup Guide

## What You're Building

```
Browser (frontend/public/index.html)
      ↕  HTTP/JSON
Express API (backend/server.js) :4000
      ↕  mysql2
MySQL (relateme database)       :3306
```

---

## File Structure

```
relateme/
├── backend/
│   ├── config/
│   │   └── db.js              ← MySQL connection pool
│   ├── middleware/
│   │   └── auth.js            ← JWT validation
│   ├── routes/
│   │   ├── auth.js            ← /api/auth/*   (login, register, me)
│   │   ├── voters.js          ← /api/voters/* (list, detail, preference, DND, activity)
│   │   ├── dashboard.js       ← /api/dashboard/* (KPI, city, firm, institute)
│   │   └── users.js           ← /api/users/*  (team management)
│   ├── server.js              ← Express entry point
│   ├── package.json
│   ├── .env.example           ← Copy this to .env and fill in your values
│   └── relateme_extras.sql    ← Run AFTER the main schema
│
└── frontend/
    └── public/
        ├── index.html         ← Your UI (modified to call real API)
        └── api.js             ← API client (Auth, Voters, Dashboard)
```

---

## Prerequisites

Install these if you don't have them already:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18+ | https://nodejs.org |
| npm | ships with Node | — |
| MySQL | 8.0+ | https://dev.mysql.com/downloads/ |

Verify:
```bash
node -v       # should print v18.x.x or higher
mysql --version
```

---

## Step 1 — Set Up the MySQL Database

### 1a. Log in to MySQL
```bash
mysql -u root -p
```

### 1b. Run the main schema (the SQL you already have)
```sql
-- Either paste the schema SQL directly, or run it from a file:
source /path/to/your/schema.sql
```
This creates the `relateme` database and all 16 tables.

### 1c. Run the extras script (adds password table + seed admin user)
```bash
mysql -u root -p relateme < backend/relateme_extras.sql
```

This creates `tbl_user_auth` and seeds one Super-Admin:
- **Email:** admin@relateme.in
- **Password:** Admin@1234
- **⚠️ Change this password after first login in production!**

---

## Step 2 — Configure the Backend

### 2a. Copy the environment file
```bash
cd backend
cp .env.example .env
```

### 2b. Edit `.env` with your values
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_ROOT_PASSWORD
DB_NAME=relateme

JWT_SECRET=pick_any_long_random_string_at_least_32_characters
JWT_EXPIRES_IN=7d

PORT=4000
NODE_ENV=development

FRONTEND_URL=http://localhost:3000
```

---

## Step 3 — Install Backend Dependencies

```bash
cd backend
npm install
```

This installs:
- **express** — web framework
- **mysql2** — fast MySQL driver (Promise-based)
- **jsonwebtoken** — JWT signing/verification
- **bcryptjs** — password hashing
- **cors** — cross-origin requests from the frontend
- **dotenv** — loads .env file
- **nodemon** (dev) — auto-restarts on file changes

---

## Step 4 — Start the Backend

### Development (auto-restarts on changes):
```bash
npm run dev
```

### Production:
```bash
npm start
```

You should see:
```
✅  MySQL connected → relateme@localhost
🚀  RelateMe API listening on http://localhost:4000
```

### Test it works:
```bash
curl http://localhost:4000/api/health
# → {"status":"ok","ts":"2026-..."}
```

---

## Step 5 — Serve the Frontend

The frontend is plain HTML/JS — no build step needed.

### Option A: VS Code Live Server (easiest during development)
1. Install the **Live Server** extension in VS Code
2. Right-click `frontend/public/index.html` → **Open with Live Server**
3. It opens at `http://localhost:3000` (or similar port)

### Option B: Python simple server
```bash
cd frontend/public
python3 -m http.server 3000
# Then open http://localhost:3000
```

### Option C: Node http-server
```bash
npm install -g http-server
cd frontend/public
http-server -p 3000
```

### Option D: Serve frontend from Express (simplest for production)
Add this to `backend/server.js` right before the 404 fallback:
```javascript
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});
```
Then everything runs on port 4000 — no separate frontend server needed.

---

## Step 6 — Open the App

1. Go to `http://localhost:3000` (or 4000 if using Option D)
2. Sign in with:
   - Email: `admin@relateme.in`
   - Password: `Admin@1234`

---

## API Endpoints Reference

All routes under `/api/` (except `/api/auth/*`) require:
```
Authorization: Bearer <jwt_token>
```

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Sign in → returns JWT |
| POST | `/api/auth/register` | Register (Pending approval) |
| GET | `/api/auth/me` | Current user info |
| GET | `/api/dashboard` | KPI cards + recent activities |
| GET | `/api/dashboard/city` | Preference breakdown by region/city |
| GET | `/api/dashboard/firm` | Breakdown by current firm |
| GET | `/api/dashboard/institute` | Breakdown by institute |
| GET | `/api/voters` | List voters (search, filter, sort, paginate) |
| GET | `/api/voters/:id` | Full voter profile |
| PATCH | `/api/voters/:id/preference` | Update P1/P2/P3/warmth/support |
| POST | `/api/voters/:id/dnd` | Toggle Do-Not-Disturb |
| POST | `/api/voters/:id/activity` | Log an interaction |
| GET | `/api/users` | List team members (Admin only) |
| PATCH | `/api/users/:id` | Approve/deactivate user (Admin only) |

### Voter list query params:
```
?search=name_or_mno
&pref=p1                   (p1|p2|p3|p4|un)
&pvs_min=0&pvs_max=1000
&catype=ACA                (ACA|FCA)
&dnd=no                    (yes|no)
&sort=pvs                  (default|org|city|pvs|pref)
&page=1&limit=100
```

---

## Registering New Users (Team Members)

1. POST to `/api/auth/register` with email, full_name, password, user_role
2. User is created with `approval_status = 'Pending'`
3. Log in as Super-Admin → Settings → Team & access
4. Approve the user (PATCH `/api/users/:id` with `{"approval_status":"Active"}`)

User roles: `Super-Admin | Admin | Candidate | DataEntry | Volunteer | Supporter | BoothCoordinator`

---

## Seeding Real Voter Data

Import your ICAI voter CSV into `tbl_ca_member`, `tbl_ca_member_fact`, and `tbl_voter`:

```sql
-- Example for a single voter
INSERT INTO tbl_ca_member
  (icai_membership_no, member_first_name, member_last_name, member_display_name,
   member_region_base, member_status)
VALUES ('M-123456', 'Rajesh', 'Mehta', 'CA Rajesh Mehta', 'SIRC', 'Active');

INSERT INTO tbl_ca_member_fact
  (icai_membership_no, is_fca_member, membership_grade, associate_year)
VALUES ('M-123456', 'Y', 'FCA', 'A2010');

INSERT INTO tbl_voter
  (election_year, voter_id, icai_membership_no, voter_region, voter_type, voter_status)
VALUES (2027, 'V-001234', 'M-123456', 'SIRC', 'Booth', 'Active');
```

For bulk imports, use MySQL's `LOAD DATA INFILE` with your CSV or a Python script.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `MySQL connection failed` | Check DB_PASSWORD in .env; ensure MySQL is running (`sudo service mysql start`) |
| `Token invalid or expired` | Log out and log in again |
| `CORS error in browser` | Make sure FRONTEND_URL in .env matches exactly where your frontend is served |
| API returns 403 on login | User's approval_status is 'Pending' — approve via admin or run the extras SQL |
| `Cannot find module 'uuid'` | Run `npm install uuid` in the backend folder |

---

## Production Checklist

- [ ] Change `JWT_SECRET` to a strong random value (32+ chars)
- [ ] Change the seed admin password
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS (put nginx or Caddy in front)
- [ ] Set `FRONTEND_URL` to your real domain
- [ ] Use environment variables from your host (not .env file) in production
- [ ] Set up MySQL backups
#   r e l a t m e  
 #   R e l a t e M e  
 #   R e l a t e M e  
 #   R e l a t e M e  
 #   R e l a t e M e  
 