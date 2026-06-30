# RelateMe — Project Status & Architecture

_Last updated: 2026-06-30. This document describes what's actually built and wired right now — not the plan, the live state. Re-generate/update it whenever a major change lands._

## 1. What this app is

A campaign workspace for a CA (Chartered Accountant) candidate running for an ICAI regional council seat. The candidate's team logs in, builds a "universe" of members they care about, assigns each one a preference tier (P1 Committed → Unassigned), tracks outreach, and reviews progress by city/firm/institute.

## 2. Stack

- **Frontend**: a single static file, `frontend/public/index.html` (~4,000 lines — all pages, all JS, inline styles), plus `frontend/public/api.js` (the HTTP client layer). No build step, no framework — vanilla JS, page sections toggled via `.page` / `.active` classes and a `showPage(id)` router.
- **Backend**: Node/Express, `backend/server.js` mounts one router per `routes/*.js` file. JWT auth (`backend/middleware/auth.js`) on every route except `/api/auth/login|register`.
- **Database**: MySQL, accessed via `mysql2/promise` (`backend/config/db.js`). **`dateStrings: true`** is set there deliberately — see §6.4.

## 3. Member identity model (the big one)

**A member's identity is `tbl_ca_member.icai_membership_no`, not a voter-roll row.** This was a deliberate re-architecture (see §7) — the voter roll (`tbl_voter`) is per-election data that may or may not be loaded; ICAI membership is always present. Every list, profile, and feature anchors on `icai_membership_no` and treats voter-roll/booth data as optional enrichment.

```
tbl_ca_member (icai_membership_no = PK)
  ├── tbl_ca_member_fact        (1:1 — ACA/FCA grade, COP status, photo)
  ├── tbl_voter                 (0:N — one row per election year this member has a roll entry for)
  │     └── tbl_booth_master → tbl_booth_address_master   (booth → city/state/address)
  ├── tbl_user_universe         (0:N — which users have this member in their universe)
  ├── tbl_voter_preference      (0:1 — P1–P4/Unassigned, PVS score)
  ├── tbl_dnd                   (0:1 — Do Not Disturb flag)
  ├── tbl_work_history          (0:N — employment/articleship/practice timeline)
  ├── tbl_voter_education_history (0:N)
  ├── tbl_voter_icai_roles      (0:N — committee/branch positions)
  ├── tbl_voter_voting_history  (0:N — per-election-year voted Y/N, drives PVS)
  ├── tbl_activity_participant  (0:N — logged interactions)
  ├── tbl_member_phones / tbl_member_emails / tbl_member_social_profiles / tbl_member_education (ICAI master contact/edu data)
```

**Practical effect**: a member with zero imported voter-roll data still shows up everywhere (All Members, Universe, profile), can be assigned a preference, and gets a PVS score. Their city, booth, and election-specific fields are simply `null`/`—` until that data is imported.

## 4. Backend routes (`backend/routes/`)

| File | Mounted at | What it does |
|---|---|---|
| `auth.js` | `/api/auth` (login/register public; rest protected) | Two-step login support (`check-email` tells the frontend whether to show "Forgot password"), `login` sets `first_login_at` on first-ever login and returns `needs_onboarding`, `complete-onboarding` marks the wizard done, `me` returns current user + onboarding status |
| `voters.js` | `/api/voters` | The core member list/profile API. `GET /` — paginated, filtered, sorted (page/limit/search/pvs/age/city/catype/firm/firm_type/universe — **city/firm/catype/firm_type accept comma-separated multi-values**). `GET /facets` — live counts per filter dimension for the sidebar, computed server-side across all ~20k members. `GET /:id` — full profile (phones, emails, work, education, roles, activities, voting history, DND). `PATCH /:id/preference`, `POST /:id/dnd`, `POST /:id/activity`, `PATCH /:id/cop`, `PUT/DELETE /:id/voting-history`, `POST /:id/work`, `POST /:id/education` |
| `universe.js` | `/api/universe` | Per-user persistent universe membership (`tbl_user_universe`), keyed by `icai_membership_no`. Add/remove triggers a PVS recalc. |
| `dashboard.js` | `/api/dashboard` | KPI totals, and city/firm/institute summary aggregates (all anchored on `tbl_ca_member`, left-joining voter/booth/work-history/education so zero-member orgs/institutes/cities still show with `total: 0` instead of vanishing). |
| `pvs.js` | `/api/pvs` | Predictive Voter Score recompute (`backend/services/pvs.js` has the actual scoring table/logic — base score + CA vintage + practice type + voting history + ICAI roles, etc.) |
| `orgs.js` | `/api/orgs` | Organisation/firm master CRUD. CA-type orgs require an FRN registration number. |
| `institutes.js` | `/api/institutes` | Institution master CRUD (schools/colleges/universities). |
| `goals.js` | `/api/goals` | Vote-target goals — one row per save (change history), latest = current. |
| `onboarding.js` | `/api/onboarding` | First-run questionnaire answers (`tbl_candidate_onboarding_profile`) — one row per user, upserted. |
| `users.js` | `/api/users` | Team management (Admin-only): list, approve/deactivate/role change, password reset. |

## 5. Frontend pages and what they're wired to

| Page (sidebar) | Backend it calls | Notes |
|---|---|---|
| My Universe | `VotersAPI.list({universe:'in', limit:2000})` | Always loads **all** universe members in one dedicated fetch — independent of whatever page All Members is on. Own client-side filter sidebar (universe is small, ~hundreds, safe to filter in the browser). |
| All Members | `VotersAPI.list(page/filters)` + `VotersAPI.facets(filters)` | **Server-side paginated** (100/page) and **server-side filtered** — the roll is ~20,000 rows, too large for the browser. The facet sidebar's checkbox counts come from `/api/voters/facets`, not computed locally. |
| City / Organisation / Institute (summary pages) | `DashboardAPI.city()/firm()/institute()` | Click "Open ›" → detail page showing that city/firm/institute's members. |
| Preferences | Same universe fetch as My Universe | **Scoped to My Universe members only** (see §8.2 — this was a real bug, now fixed). |
| Goals & Target | `GoalsAPI` | Also embedded as wizard Step 1 with validation (P1+P2+P3+>P3 must equal target exactly). |
| Campaign Questionnaire | `OnboardingAPI` + `DashboardAPI.city()/firm()` (for the live-count pickers) | See §9 — Phase 2 of the onboarding questionnaire. |
| Settings & Profile | `UsersAPI` | Team list, role/status changes, password reset (no email service exists — admin sets a new password and shares it out-of-band). |
| Member Profile | `VotersAPI.get(id)` + the various PATCH/POST endpoints | One page, 11 numbered sections (Voting History is now section 6, same visual treatment as the rest — was previously an unnumbered "★"). Personal Details' COP/DND are gated behind an "Edit" toggle. |

## 5.10 Multi-firm fix, contact section split, Gmail/WhatsApp picker (latest round)

- **Real bug fixed: a member can be an active partner at more than one firm at once.** Adding/editing a Work History entry to "Active" used to auto-close-out (mark Inactive) any other entry that was already Active — wrong, since a CA can be a partner at two firms simultaneously. Removed that auto-deactivation from both `POST` and `PATCH /api/voters/:id/work`. Because list views (All Members, My Universe, etc.) show one row per member with one "current org" column, `joinsSql()`'s work-history join was changed from a plain `work_status='Active'` match (which could now return 2+ rows and duplicate the member in lists) to a correlated subquery picking just the most-recent active entry — verified a member with two active firms still appears exactly once in `/api/voters` search results, with both entries staying Active in their full profile.
- **Add Contact form layout corrected**: Contact type + Is primary? on the first line, Number/Address full-width on the second, Type + On WhatsApp? on the third — per a direct correction (the earlier "next to Type" placement was a misread of the original ask).
- **Contact Details and History is now two separate sections** — Phone listed first, then Email — instead of one interleaved list.
- **Email/WhatsApp quick-actions now resolve ambiguity instead of guessing**: Email opens the primary address directly (via Gmail's web compose, `mail.google.com/mail/?view=cm`, not `mailto:`, since `mailto:` depends on a desktop client being configured); with no primary set and more than one email on file, a small in-page picker asks which one. WhatsApp opens directly when exactly one number is flagged "On WhatsApp?"; with two or more flagged, the same picker asks which number. New `openChoiceModal(title, options, onPick)` (paired with `#choice-overlay`) is the shared mechanism, modeled on the existing `confirmAction` in-page modal pattern.
- **Firm-wise and Institute-wise summary pages got a Status (Active/Inactive) filter** dropdown next to the existing Type filter — backed by new `status` query params on `GET /api/dashboard/firm` and `GET /api/dashboard/institute`.

## 5.9 Data fix, detail-page simplification, contact/profile polish (earlier round)

- **Fixed a major data bug**: `tbl_ca_member.member_display_name` had the literal text "NULL" baked in as a separator for 19,831 of 19,966 members (e.g. "RATNAMNULLKNULLR" instead of "RATNAM K R") — an import-time artifact predating this project. First/middle/last name columns were also all NULL for these rows, so there was no better source to reconstruct from; replacing the literal "NULL" substring with a space was verified correct for the overwhelming majority (no leading/trailing/doubled NULL found). This is a **data fix, not a schema change** — logged in `relateme_extras.sql` for the record.
- **City/Firm/Institute detail pages simplified and fixed a real staleness bug**: they used to filter the client-side `MEMBERS` cache (`MEMBERS.filter(m=>m.city===cityName)`), which only ever holds whatever page was last loaded — wrong for any city/firm/institute not in that page. They now fetch fresh from `/api/dashboard/city|firm|institute` by exact name. Per explicit instruction, the *detail* page for one entity now shows only identity info (+ registration no./type/status for organisations, + type/status for institutes) and member/in-universe/not-in-universe counts — no P1-P4 breakdown there; that stays on the *summary* list pages, which is the only place it's wanted. Removed ~180 lines of now-dead chart/pie code (`drawPieChart`, `getCityData`/`getFirmData`/`getInstituteData`, `nameLink`) along with the rewrite.
- **Org/Institute status is now editable from the detail page** — `PATCH /api/orgs/:id/status` / `PATCH /api/institutes/:id/status`, with a "Mark Active/Inactive" button next to the status badge.
- **Preference / Assigned Preference pages got the same Amazon-style Filters popover** as My Universe (City/Organisation/Firm Type/Membership — computed client-side over the already-loaded universe, same exclude-ACA convention as everywhere else). The P1-P4 tier itself keeps its existing dedicated toggle row, not duplicated into the popover.
- **tel:/mailto: links made more reliable** — switched from `window.location.href = 'tel:...'` to creating and clicking a real temporary `<a>` element, which protocol-link handlers respect more consistently across browsers than a bare location assignment.
- **Member profile polish**: labels now show as chips in the hero; every pencil icon (✎) replaced with the word "Edit" (including the Personal Details/Campaign edit-toggle buttons); Work History and Voter/Voting History columns reordered so Status is last with Edit beside it (Contact and Educational were already in that order); Add Contact's "Is primary?" field moved next to "Type" instead of its own row; new Work History entries default "To year" to the current year when status isn't Active (still editable).

## 5.8 Call list / meet list / labels / competitor tagging, profile & summary-table overhaul (earlier round)

- **New persisted tagging**: `tbl_member_action_tag` (call_list / meet_list / competitor — simple per-member toggles) and `tbl_member_label` (free-text, multiple per member). Backend: `POST/DELETE /api/voters/:id/tag`, `/api/voters/bulk-tag`, `/api/voters/:id/label`, `/api/voters/bulk-label`. All Members got 3 new bulk-action buttons (Add to call list / Add to meet / Label); the member profile's old "Meet"/"Add to to-do" buttons (previously just a toast, nothing saved) now toggle the real `meet_list`/`call_list` tags, plus a dedicated "Mark as competitor" button.
- **Contact details can now actually be added**: `tbl_member_phones`/`tbl_member_emails` had no INSERT route before — only seeded data could ever show up. Added `POST /api/voters/:id/phone` and `/email`. The profile's Contact section is now one unified table (phones + emails together), active contacts sorted first with a green dot, inactive ones below with a grey one — replacing the old flat Email1/2/3 + Mobile1/2/3 grid plus separate history tables.
- **Member profile restructure**: sections reordered (Personal → Contact → Voter & Voting → Professional & Work → Educational → Campaign → Committees & Roles → Addresses → Interactions → Influence); side-nav numbers dropped. Personal Details: removed Full Name (redundant with the hero header) and Gender (moved to the hero badges), merged ACA/FCA into one row and DOB/Age into one row, removed the DND row (now a dedicated always-visible hero button, no longer gated behind "Edit"), dropped the "SYSTEM" badge text everywhere (kept the 🔒 lock icon). Committees & Roles dropped the Branch Committee field.
- **Dashboard tables (Organisation/City/Institute) swapped their P1-P4 breakdown for In-Universe / Not-in-Universe counts** (per-user, scoped to `tbl_user_universe`) — the more useful "who's mine vs. not" view for a campaign team working from these pages. Organisation now shows the registration number under the firm name (only for CA firms); Institute now shows live `institute_status` from the DB. The "Open ›" link/column was removed from all three (the name itself is still clickable). City has no `type` column — there's no such field in the schema, so it was left out rather than added on a templated guess.
- **All Members**: the "My Universe" filter moved out of the facet popover into a standalone toggle beside the search box; the Membership facet now only offers FCA (every voter is ACA by default, so that option added no signal); toggling the universe filter on reveals a Preference column on the table (hidden otherwise); the orange instructional banner was removed.
- **Sidebar Preference split**: "Preferences" became two entries sharing the same page — **Assigned Preference** (defaults to showing only members who already have a P1-P4 tier set) and **Preference** (defaults to showing everyone, including Unassigned, for the assignment workflow). The tier filter buttons are now multi-select — picking both P1 and P2 shows members who are either (OR, not AND).

## 5.7 Real type filters + searchable onboarding pickers (earlier round)

- **Firm-wise/Institute-wise "sort by type" replaced with a real filter.** The previous dropdown just reordered the list (grouped CA/Non-CA together but still showed everything) — now it's an actual filter: picking "CA" only returns CA firms (`GET /api/dashboard/firm?type=CA`), picking "School" only returns schools (`?type=SCHOOL`), etc. Verified the two type counts sum exactly to the total (94,161 CA + 5,158 Non-CA = 99,319).
- **Onboarding questionnaire's city/firm pickers (Q1, Q3, Q4) are now live search instead of a flat top-30 list.** With 99k+ firms, a static "top 30 by member count" list could never reach most of them. `obRenderCityPicker`/`obRenderFirmPicker` now render a search box; typing debounce-fetches `DashboardAPI.city({search})` / `DashboardAPI.firm({search})` and shows live matching results with their current CA count, multi-select via checkboxes. Selected items are pinned in a separate chip row above the search results so they don't disappear when the query changes. Firm labels (names aren't in the saved `org_id` list) are cached client-side (`obFirmLabelCache`) as they appear in search results, pre-warmed from the top-firms list so previously-saved selections show a name immediately rather than a bare id.

## 5.6 Schema simplification + Voter/Voting merge (earlier round)

- **`tbl_work_history` simplified per follow-up feedback**: `firm_reg_no` renamed to `org_reg_no` (matches `tbl_org_details`' own column name — it IS that value, snapshotted); `from_date`/`to_date` removed (year precision only, matching the rest of the app); `is_current` removed entirely — `work_status = 'Active'` is now the single signal for "this is the current firm," read directly everywhere that used to check `is_current` (the `cur_org` join, PVS's current-work-type lookup, `member_count` cache refresh, the dashboard preference breakdown).
- **`tbl_voter` (CONFIRMED, untouched) and `tbl_voter_voting_history` had the same grain** — both were one-row-per-member-per-election-year. Rather than alter the CONFIRMED table, `tbl_voter_voting_history` absorbed `tbl_voter`'s detail columns (`voter_id`, `voter_booth_no`, `voter_type`, `voter_sub_type`, `voter_status`) alongside its own `voted`. The member profile's "Voter Details" and "Voting History" sections (previously #2 and #6) are now one merged section (#2, "Voter Details & Voting History") — one table, one row per election year. `joinsSql()`/`baseSql()`, `pvs.js`'s vintage calc, and `dashboard.js`'s city booth-chain all now read the booth/voter fields from `tbl_voter_voting_history` instead of `tbl_voter`. The `PUT /:id/voting-history` upsert uses `COALESCE` so a partial update (just flipping the inline "Voted" dropdown) doesn't null out the other fields — only an explicit edit (via "+ Add year") overwrites them.
- **Sort-by-type** added to Firm-wise (CA / Non-CA) and Institute-wise (School/College/Institute/University) summary pages — a `sort` query param on `GET /api/dashboard/firm|institute` (`default` = member count, `type` = grouped by type).

## 5.5 Work History / firm-relation fields, search-select pickers (earlier round, partly superseded above)

- **`tbl_work_history` extended** instead of creating a separate "member firm relation" table (table was empty, no migration risk): added `firm_reg_no` (point-in-time snapshot of the org's reg no — `org_id`/`icai_membership_no` stay the join keys), `from_date`/`to_date` (day precision, alongside the existing `from_year`/`to_year` which are still auto-derived for anything else reading them), and `remark`. `work_status`'s vocabulary changed from `('Active','Completed')` to `('Active','Inactive','Not a member','Expired')`. `designation` is now constrained to `Partner / Senior Partner / Engagement Partner / Managing Partner` (enforced in the form + the backend route, not the DB column itself, which stays varchar). `is_current` is now derived server-side from `work_status === 'Active'` rather than a separate client flag — there's a single source of truth for "current firm" everywhere (All Members, My Universe, dashboard, member profile).
- **Search-select replaces flat dropdowns** for picking an existing firm or institution (the org/institute master lists are 99k+ rows — a `<select>` with every row doesn't work at that scale). New `type:'searchselect'` field in the shared `showFormModal()` system (`frontend/public/index.html`, the `fmSearchSelectInput`/`fmSearchSelectPick`/`fmClearSearchSelect` functions): a text input with a debounced live search dropdown, backed by `GET /api/orgs?search=` / `GET /api/institutes?search=` (both now match name *or* registration number, and both cap results server-side — no more accidentally pulling the entire master list). Used by:
  - **Add Work Entry** (member profile, section 4) — firm search-select + designation/status dropdowns + date pickers.
  - **Add Education Entry** (member profile, section 7) — one shared search-select field that switches what it searches (firms vs. institutions) based on the course-type dropdown; selecting "Articleship" now actually works end-to-end (it silently couldn't submit before — the form never collected the firm `org_id` the backend required for that course type).
- **Organisation (Firm-wise) page was slow (~1s/page at 99,319 firms).** Root cause: `GET /api/dashboard/firm` did a `GROUP BY` over the full org↔work-history JOIN on every page load just to sort by member count. Fixed with a cached `tbl_org_details.member_count` column, kept in sync incrementally by `POST /api/voters/:id/work` (only the affected org row(s) get recomputed on write, not all 99k on every read). The page now sorts/paginates that column directly — page loads dropped to 20-150ms. The P1-P4 preference breakdown is still computed live, but scoped to just the ~50 orgs on the current page instead of the whole table.

## 6. Notable fixes made during the icai_membership_no migration

These were real bugs found and fixed, not just refactoring:

1. **Dashboard never loaded on navigation.** `loadDashboard()` existed but nothing called it when clicking the Dashboard sidebar item — fixed in `showPage()`'s routing.
2. **Preferences page leaked non-universe members.** It filtered the shared `MEMBERS` client cache directly instead of scoping to `addedToUniverse` — after visiting All Members (which also populates that shared cache), Preferences would show extra members it shouldn't. Fixed by scoping the filter and giving Preferences its own dedicated universe fetch.
3. **Frontend `Number()`/`parseInt()` coercion of membership numbers.** Universe IDs and row-checkbox IDs were being coerced to JS numbers in a couple of places — harmless while membership numbers happen to look numeric, but would silently corrupt any with leading zeros or letters. Removed.
4. **Date timezone bug.** `dateStrings` was `false` on the MySQL pool, so DATE columns came back as JS `Date` objects that serialize to UTC ISO strings — for any timezone east of UTC (e.g. IST), reading just the date part shifts the calendar day backward by one. Confirmed happening on the onboarding questionnaire's outreach date. Fixed globally by setting `dateStrings: true` (verified the one place that relied on JS `Date` objects, `pvs.js`'s CA-vintage calc, still works correctly with date strings).
5. **My Universe could silently drop members.** Before the rewrite, My Universe shared the same 500-row flat load as All Members — any universe member outside that load wouldn't render. Now decoupled with its own complete fetch.

## 7. Why the schema looks the way it does (for future-you)

- `tbl_app_user`, `tbl_org_details`, `tbl_voter`, `tbl_ca_member`, `tbl_ca_member_fact`, and the contact/education tables are marked `CONFIRMED` in the original schema notes — meaning don't restructure them casually. `tbl_user_auth` (passwords) exists as a *separate* table for exactly this reason; the icai_membership_no re-key followed the same pattern (new FK columns added, old `tbl_voter`-pointing ones dropped, rather than touching `tbl_ca_member` itself).
- `tbl_voter` lost its `voter_region` column — city now resolves via `tbl_voter.voter_booth_no → tbl_booth_master → tbl_booth_address_master.booth_city`. Both booth tables are currently **empty** (schema only, per explicit instruction — no fabricated data). City-dependent features (the city facet, city-wise summary, the questionnaire's city pickers) will populate once real booth/voter-roll data is imported.
- `relateme_extras.sql` in `backend/` documents every non-"CONFIRMED" schema change made outside the original master schema, including this migration. It's a record of what was done, not a safely-re-runnable script (some statements aren't idempotent).

## 8. Onboarding / first-login flow

First-ever login (detected via `first_login_at` on `tbl_user_auth`) routes into a gated setup wizard instead of the app:

1. **Goals & Target** — mandatory, blocks "Continue" until P1+P2+P3+(>P3) exactly equals the target.
2. **Campaign Questionnaire** — skippable, see §9.
3. **Assign Preferences** — scoped to whatever's in Universe at that point.
4. **Summaries** — City-wise → Firm-wise → Institute-wise review.

The sidebar is click-blocked (with a toast) while the wizard is active. Returning logins skip straight to My Universe. The wizard banner reuses the real pages underneath it (no duplicated UI) — see `startSetupWizard()`/`wizardContinue()` in index.html.

## 9. Onboarding Questionnaire — Phase 2 status

17 questions were specified from candidate screenshots. **Only the simple fields are built** (Q1, 2, 3, 4, 5, 6, 7, 8, 16):

- Q1/Q3 (cities seeking votes from / practice cities): checklist UI exists, **pulls live counts from `/api/dashboard/city`, which is empty until booth/voter data is imported.**
- Q4 (past firms): checklist UI exists, pulls counts from `/api/dashboard/firm` (works now — firm membership comes from `tbl_work_history`, not booth data).
- Q2 (ICAI branch): free-text input — no branch master table exists in the data, so this isn't a dropdown.
- Q5 (articleship principal): Yes/No toggle + conditional student-count field.
- Q6 (coaching institutes): free-text tag chips (no backend matching/autocomplete).
- Q7/Q8/Q16 (CA Final year / college / outreach date): plain inputs.

**Not built yet (Phase 3)**:
- Q9 (import phone contacts) — needs the mobile Contact Picker API + a desktop CSV-upload fallback, matched against `tbl_member_phones`.
- Q10/12/13/14/15 (tag supporters/influencers/competitors/ex-colleagues/allies) — needs a member-search-and-tag component backed by a new normalized table (proposed: `tbl_candidate_network_tag`).
- Q11 (firms backing you) — chip tagging against the org master.
- Q17 (LinkedIn/email "Connect") — needs real OAuth credentials; stays a visual placeholder until provided.
- The "shortlist rule" that's supposed to seed My Universe from questionnaire answers (region match, firm match, tagged relationships) — not implemented; My Universe is still manually curated only.

## 10. What's verified working (tested live against the real ~20,000-member dataset, browser-driven, zero console errors)

Sign-in (two-step, forgot-password gating) → first-login wizard (all 4 steps, validation, sidebar lock) → returning-login skip → Dashboard KPIs → All Members (pagination, multi-select facets with live server counts, search, sort) → My Universe (decoupled load, add/remove) → Preferences (universe-scoped) → Organisation/Institute CRUD + summary pages + detail pages → Member Profile (Edit-gated COP/DND, preference assignment with confirm dialog, work/voting/education history add, Contact phone/email history tables, interaction logging) → Settings/Team (list, password reset) → Campaign Questionnaire (save + reload persistence, live picker counts).

## 11.5 Pagination (added after real data scaled up)

Once real org/institute data was imported (firms alone grew to **99,319 rows**), the City/Firm/Institute summary pages and My Universe got the same treatment as All Members:

- `GET /api/dashboard/city|firm|institute` now take `page`/`limit`/`search` and return `{ rows, total, page, limit }`. Default 50/page.
- My Universe now uses the same server-paginated/filtered pattern as All Members (100/page) instead of a flat `limit: 2000` fetch — a large universe won't silently get cut off either. Its facet sidebar (city/org/membership/firm-type/**preference**) is computed by the same `/api/voters/facets` endpoint, permanently scoped to `universe=in`; a `pref` dimension was added to that endpoint for this.
- **Performance note**: the firm/institute count queries were optimized — since their `GROUP BY` key is the table's own primary key, the total row count doesn't need the expensive JOIN+GROUP BY at all (plain `COUNT(*) FROM tbl_org_details`, ~instant). The main paginated query still needs the full aggregation (no index can help sorting by a computed `COUNT()`), so it costs ~1s per page at 99k rows. If that's not snappy enough later, the real fix is a precomputed/cached member-count column (refreshed on a schedule or via triggers) rather than computing it live every request.
- One thing this turned up that **wasn't a bug**: a report of "everyone shows as added to My Universe" on page 2 of All Members traced back to genuine leftover test data (495 rows in `tbl_user_universe` — exactly the first 500 members alphabetically, from an earlier "select all + bulk add" test). Cleared, not a code issue.

## 12. Known gaps / things to tell the user before they assume otherwise

- City data, the city facet, and city-wise summaries will all show empty/zero until real booth + voter-roll data is imported (Booth Master + Booth Address Master tables are empty by design).
- Facet counts in the All Members sidebar are computed against every *other* active filter, but **not** cross-filtered against each other within the same request batch in a single round-trip optimization sense — each dimension is its own query. Fine at current scale; revisit if the roll grows another order of magnitude.
- No real email service is configured anywhere — "Forgot password" is a manual admin-reset flow, not an emailed link.
- Booth/voter-roll re-import format should match the candidate's real spreadsheets (`Election, MRN, Serial No, boothno, boothno_old, Polling_type` for voter rows; `boothAddressID, Booth State, Booth Name, Booth CITY, Booth Address, Booth Pin Code, Booth URL` for the address master; `Election, boothno, boothAddress ID` for the booth master) — the new tables' columns were modeled directly on those.
