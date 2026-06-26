# RelateMe — Changes Applied

Goal: remove all fake/demo data from the frontend, wire every supported section to the
live API + MySQL database, and fix the bugs that stopped the stack from running.
Your database schema is treated as final — **no DB schema changes**. The code was
aligned to match your DB.

> NOTE: `node_modules` is NOT included in this zip to keep it small.
> Run `npm install` inside `backend/` before starting.

---

## 1. Backend bug fixes (aligned to your finalized schema)

### `routes/voters.js`
- **Removed `warmth` everywhere.** `tbl_voter_preference` has no `warmth` column, so the
  old `BASE_SQL` (and the preference PATCH + activity upsert) crashed with
  *Unknown column 'vp.warmth'* on every voter list/profile request. All `warmth`
  reads/writes deleted.
- **Fixed `LIMIT ? OFFSET ?`.** Prepared-statement placeholders for LIMIT/OFFSET fail on
  MySQL. Now uses validated, clamped integers inlined into the query (page ≥ 1,
  limit 1–1000).

### `relateme_extras.sql`
- **Seed admin role fixed.** Was `user_role = 'Super-Admin'`, which your enum
  `('Admin','Candidate','Volunteer')` rejects — the INSERT failed, so login was impossible.
  Now seeds `'Admin'`. (Login: `admin@relateme.in` / `Admin@1234`.)

### `routes/auth.js` and `routes/users.js`
- **Allowed-role lists fixed** to match your enum `('Admin','Candidate','Volunteer')`
  (removed `Super-Admin`, `DataEntry`, `Supporter`, `BoothCoordinator`).
- `requireAdmin` now checks for `'Admin'`.

---

## 2. Frontend — fake data removed, wired to API (`frontend/public/index.html`)

### Removed synthetic data generators
- Deleted the `MEMBERS.forEach` enrichment block that fabricated voter IDs, booth history,
  secondary phones/emails, committees, specializations, ACA/FCA strings and addresses.
- Removed the hardcoded universe seed `Set([1..12])` and a duplicate `memberPrefs`
  declaration.
- Removed fake preference-history seed rows.
- Zeroed hardcoded Goals demo numbers (1980/600/900/480) and the "1,800 previous quota";
  previous-year quota is now an input.
- Replaced the entire static demo **dashboard** body (fake daily progress 7/10, 285,
  12-day streak, 92%; fake preference donut; fake support funnel; fake priority actions;
  fake city snapshot; fake upcoming events; fake "CA Lakshmi/Karthik/Suresh" activity rows)
  with API-driven cards and honest empty states.

### Wired to live API
- **Voter profile** (`renderMemberProfile`) is now async → `VotersAPI.get(id)`. Renders real
  phones, emails, socials, work history, education, ICAI roles and activities from the DB.
- **Interactions** show real activities and a working in-page "Log interaction" modal
  (centered in the page, not a browser popup) → `POST /api/voters/:id/activity`.
- **Committees & Roles** read from real `tbl_voter_icai_roles`.
- **Work history / Education** render from the real API payload with empty states.
- **City / Firm / Institute tables** pull from `GET /api/dashboard/city|firm|institute`.
- **Dashboard** KPIs, preference breakdown, voter funnel, top regions and recent activity
  all come from `GET /api/dashboard`.
- **Preference buttons** (P1–P4) → `PATCH /api/voters/:id/preference`.
- **DND toggle** (list AND profile) → `POST /api/voters/:id/dnd`.
- **Settings → Team & access** lists real users → `GET /api/users`, with activate/deactivate
  → `PATCH /api/users/:id`.

### Add / Edit dialogs
- All add/edit/confirm dialogs already use the in-page modal system
  (`showFormModal` / `confirmAction`) — they render centered in the web page, never as
  browser `prompt()`/`alert()`/`confirm()` popups. Remaining stray `alert()` in
  `submitGoals` was replaced with the in-page toast.

---

## 3. Sections with NO database table or backend route

Your DB and backend currently have **no storage** for these, so they now show clean empty
states instead of fabricated data (nothing to wire them to yet):

- Groups, Labels, Reminders, Events, Influencer Types
- Related Contacts, "I Know / They Know"
- Organisation Groups, Message Templates
- Goals & target-setting (works as a session-only planner; no goals table exists)
- Preference-change history (no history table; session-only)
- Addresses, booth *history* (only the current voter row exists per election year)

To make these persistent you'd need new tables + matching `/api/...` routes.

---

## 4. How to run

```bash
# 1. DB (your schema is already final). Add the auth table + seed admin:
mysql -u root -p relateme < backend/relateme_extras.sql

# 2. Backend
cd backend
npm install            # node_modules is not bundled
npm run dev            # or: npm start   → http://localhost:4000

# 3. Frontend
cd ../frontend/public
python3 -m http.server 3000   # → http://localhost:3000

# 4. Log in
#   admin@relateme.in / Admin@1234   (change after first login)
```

Until you import real ICAI data into `tbl_ca_member`, `tbl_ca_member_fact` and `tbl_voter`,
every list will be empty (by design) — no fake rows will appear.

## 5. Verification done
- All backend `.js` files pass `node --check`.
- The frontend app script passes `node --check`; `<div>` tags balanced.
- Could NOT run the live stack here (no MySQL server / no network in this environment),
  so verification was static. Once you start the backend with data imported, the path
  auth → voters → profile → preference/DND/activity → dashboard should work.
