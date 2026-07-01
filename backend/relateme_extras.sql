-- ============================================================================
--  relateme_extras.sql
--  Run this AFTER the main schema to add tables the backend needs.
--  Safe to run multiple times (IF NOT EXISTS).
-- ============================================================================

USE relateme;

-- Password storage for tbl_app_user
-- (tbl_app_user is CONFIRMED / locked, so we don't modify it directly)
CREATE TABLE IF NOT EXISTS tbl_user_auth (
  user_id       CHAR(36)     NOT NULL,
  password_hash VARCHAR(255) NOT NULL             COMMENT 'bcrypt hash',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_user_auth_user FOREIGN KEY (user_id)
    REFERENCES tbl_app_user(user_id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Password hashes — separated from tbl_app_user (CONFIRMED)';

-- First-login / onboarding-wizard gating. Lives here (not on tbl_app_user,
-- which is CONFIRMED/locked) for the same reason password_hash does.
-- first_login_at        : set the first time this user ever logs in successfully.
--                          NULL = "Forgot password" is hidden on sign-in (they were
--                          just emailed credentials, nothing to recover yet).
-- onboarding_completed_at: set when the first-run setup wizard is finished/unlocked.
--                          NULL = next login goes into the wizard instead of the app.
ALTER TABLE tbl_user_auth
  ADD COLUMN IF NOT EXISTS first_login_at DATETIME NULL DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at DATETIME NULL DEFAULT NULL;

-- Optional: seed one Super-Admin user so you can log in immediately.
-- Password: Admin@1234  (change after first login)
-- bcrypt hash of 'Admin@1234' with 12 rounds:
INSERT IGNORE INTO tbl_app_user
  (user_id, email, full_name, user_role, approval_status)
VALUES
  ('00000000-0000-0000-0000-000000000001',
   'admin@relateme.in',
   'Super Admin',
   'Admin',
   'Active');

INSERT IGNORE INTO tbl_user_auth (user_id, password_hash)
VALUES
  ('00000000-0000-0000-0000-000000000001',
   '$2a$12$RNe/wt7/6TKW4Hfcl/dLUuYCSmRnEI9kYqGdGl/JW0S8MXjHZ5gO');
-- ↑ This is bcrypt('Admin@1234', 12). CHANGE THIS PASSWORD in production.

-- ============================================================================
--  MIGRATION (one-time, already applied to the dev DB) — member identity is
--  now anchored on tbl_ca_member.icai_membership_no, not tbl_voter.voter_record_id.
--  Reason: voter-roll data is per-election and may not be loaded for every
--  member; ICAI membership is the one thing that's always present. Booth/city
--  data moves to two new lookup tables instead of living on tbl_voter directly.
--  These ALTERs are NOT idempotent (columns/keys won't exist on a second run) —
--  this block is a record of what was done, not a script to re-run.
-- ============================================================================

CREATE TABLE IF NOT EXISTS tbl_booth_address_master (
  booth_address_id BIGINT NOT NULL AUTO_INCREMENT,
  booth_state       VARCHAR(100) NOT NULL,
  booth_state_code  VARCHAR(10)  DEFAULT NULL,
  booth_name        VARCHAR(200) NOT NULL,
  booth_city        VARCHAR(100) NOT NULL,
  booth_address     VARCHAR(500) DEFAULT NULL,
  booth_pincode     VARCHAR(20)  DEFAULT NULL,
  booth_url         VARCHAR(500) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36) DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by CHAR(36) DEFAULT NULL,
  PRIMARY KEY (booth_address_id),
  KEY idx_booth_addr_city (booth_city),
  CONSTRAINT fk_booth_addr_created_by FOREIGN KEY (created_by) REFERENCES tbl_app_user(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_booth_addr_updated_by FOREIGN KEY (updated_by) REFERENCES tbl_app_user(user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Booth Address Master - one row per physical polling booth location';

CREATE TABLE IF NOT EXISTS tbl_booth_master (
  booth_master_id  BIGINT NOT NULL AUTO_INCREMENT,
  election_year     SMALLINT NOT NULL,
  boothno           VARCHAR(50) NOT NULL,
  boothno_old       VARCHAR(50) DEFAULT NULL,
  booth_address_id  BIGINT DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36) DEFAULT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by CHAR(36) DEFAULT NULL,
  PRIMARY KEY (booth_master_id),
  UNIQUE KEY uq_booth_master_year_no (election_year, boothno),
  KEY idx_booth_master_addr (booth_address_id),
  CONSTRAINT fk_booth_master_addr FOREIGN KEY (booth_address_id) REFERENCES tbl_booth_address_master(booth_address_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_booth_master_created_by FOREIGN KEY (created_by) REFERENCES tbl_app_user(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_booth_master_updated_by FOREIGN KEY (updated_by) REFERENCES tbl_app_user(user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Booth Master - maps an election-years booth number to its address master row';

-- Re-key every per-member fact/relation table from voter_record_id -> icai_membership_no.
ALTER TABLE tbl_user_universe
  DROP FOREIGN KEY fk_uu_voter, DROP PRIMARY KEY, DROP COLUMN voter_record_id,
  ADD COLUMN icai_membership_no VARCHAR(20) NOT NULL AFTER user_id,
  ADD PRIMARY KEY (user_id, icai_membership_no),
  ADD KEY idx_uu_member (icai_membership_no),
  ADD CONSTRAINT fk_uu_member FOREIGN KEY (icai_membership_no) REFERENCES tbl_ca_member(icai_membership_no) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE tbl_voter_preference
  DROP FOREIGN KEY fk_pref_voter, DROP KEY uq_pref_voter, DROP COLUMN voter_record_id,
  ADD COLUMN icai_membership_no VARCHAR(20) NOT NULL AFTER pref_id,
  ADD UNIQUE KEY uq_pref_member (icai_membership_no),
  ADD CONSTRAINT fk_pref_member FOREIGN KEY (icai_membership_no) REFERENCES tbl_ca_member(icai_membership_no) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE tbl_dnd
  DROP FOREIGN KEY fk_dnd_voter, DROP KEY uq_dnd_voter, DROP COLUMN voter_record_id,
  ADD COLUMN icai_membership_no VARCHAR(20) NOT NULL AFTER dnd_id,
  ADD UNIQUE KEY uq_dnd_member (icai_membership_no),
  ADD CONSTRAINT fk_dnd_member FOREIGN KEY (icai_membership_no) REFERENCES tbl_ca_member(icai_membership_no) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE tbl_activity_participant
  DROP FOREIGN KEY fk_ap_voter, DROP KEY uq_activity_participant, DROP COLUMN voter_record_id,
  ADD COLUMN icai_membership_no VARCHAR(20) NOT NULL AFTER activity_id,
  ADD UNIQUE KEY uq_activity_participant (activity_id, icai_membership_no),
  ADD CONSTRAINT fk_ap_member FOREIGN KEY (icai_membership_no) REFERENCES tbl_ca_member(icai_membership_no) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE tbl_work_history
  DROP FOREIGN KEY fk_work_voter, DROP KEY idx_work_voter, DROP COLUMN voter_record_id,
  ADD COLUMN icai_membership_no VARCHAR(20) NOT NULL AFTER wh_id,
  ADD KEY idx_work_member (icai_membership_no),
  ADD CONSTRAINT fk_work_member FOREIGN KEY (icai_membership_no) REFERENCES tbl_ca_member(icai_membership_no) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE tbl_voter_icai_roles
  DROP FOREIGN KEY fk_roles_voter, DROP KEY idx_roles_voter, DROP COLUMN voter_record_id,
  ADD COLUMN icai_membership_no VARCHAR(20) NOT NULL AFTER role_id,
  ADD KEY idx_roles_member (icai_membership_no),
  ADD CONSTRAINT fk_roles_member FOREIGN KEY (icai_membership_no) REFERENCES tbl_ca_member(icai_membership_no) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE tbl_voter_voting_history
  DROP FOREIGN KEY fk_vh_voter, DROP KEY uq_vh_voter_year, DROP KEY idx_vh_voter, DROP COLUMN voter_record_id,
  ADD COLUMN icai_membership_no VARCHAR(20) NOT NULL AFTER vh_id,
  ADD UNIQUE KEY uq_vh_member_year (icai_membership_no, election_year),
  ADD CONSTRAINT fk_vh_member FOREIGN KEY (icai_membership_no) REFERENCES tbl_ca_member(icai_membership_no) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE tbl_voter_education_history
  DROP FOREIGN KEY fk_edu_voter, DROP FOREIGN KEY fk_edu_principal,
  DROP KEY idx_edu_voter, DROP KEY fk_edu_principal,
  DROP COLUMN voter_record_id, DROP COLUMN principal_voter_id,
  ADD COLUMN icai_membership_no VARCHAR(20) NOT NULL AFTER edu_hist_id,
  ADD COLUMN principal_icai_membership_no VARCHAR(20) DEFAULT NULL COMMENT 'Articleship principal (another member)',
  ADD KEY idx_edu_member (icai_membership_no),
  ADD KEY idx_edu_principal2 (principal_icai_membership_no),
  ADD CONSTRAINT fk_edu_member FOREIGN KEY (icai_membership_no) REFERENCES tbl_ca_member(icai_membership_no) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT fk_edu_principal2 FOREIGN KEY (principal_icai_membership_no) REFERENCES tbl_ca_member(icai_membership_no) ON DELETE SET NULL ON UPDATE CASCADE;

-- tbl_voter itself: voter_region removed — city now comes from
-- tbl_voter.voter_booth_no -> tbl_booth_master -> tbl_booth_address_master.booth_city.
ALTER TABLE tbl_voter DROP COLUMN voter_region;

-- Phase 2: first-run onboarding questionnaire answers (simple fields only —
-- city/firm pickers, branch, articleship, CA Final year, college, outreach date).
CREATE TABLE IF NOT EXISTS tbl_candidate_onboarding_profile (
  user_id CHAR(36) NOT NULL,
  seeking_vote_cities JSON DEFAULT NULL COMMENT 'Q1 - cities seeking votes from',
  icai_branch VARCHAR(150) DEFAULT NULL COMMENT 'Q2',
  practice_cities JSON DEFAULT NULL COMMENT 'Q3 - cities of practice/personal presence',
  past_firm_org_ids JSON DEFAULT NULL COMMENT 'Q4 - org_ids of past firms worked at',
  is_articleship_principal ENUM('Y','N') DEFAULT NULL COMMENT 'Q5',
  articleship_student_count INT DEFAULT NULL COMMENT 'Q5',
  coaching_institutes JSON DEFAULT NULL COMMENT 'Q6 - free-text tags',
  ca_final_year YEAR DEFAULT NULL COMMENT 'Q7',
  graduation_college VARCHAR(200) DEFAULT NULL COMMENT 'Q8',
  outreach_start_date DATE DEFAULT NULL COMMENT 'Q16',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_onboarding_profile_user FOREIGN KEY (user_id) REFERENCES tbl_app_user(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Phase 2 onboarding questionnaire answers (simple fields only)';

-- tbl_work_history: richer "firm relation" fields, added directly to this
-- table instead of a separate one (per explicit instruction). org_id remains
-- the join key to tbl_org_details and icai_membership_no the join key to
-- tbl_ca_member; firm_reg_no is a point-in-time snapshot of the org's reg no
-- (kept even if the org's own reg no changes later). from_date/to_date give
-- day precision alongside the existing from_year/to_year (still populated,
-- derived from the dates, for any other code reading them). work_status's
-- vocabulary changed from ('Active','Completed') to the requested
-- ('Active','Inactive','Not a member','Expired') — table was empty, no
-- data migration needed.
ALTER TABLE tbl_work_history
  ADD COLUMN firm_reg_no VARCHAR(100) NULL COMMENT 'snapshot of org_reg_no at time of entry' AFTER org_id,
  ADD COLUMN from_date DATE NULL AFTER from_year,
  ADD COLUMN to_date DATE NULL AFTER to_year,
  ADD COLUMN remark VARCHAR(500) NULL AFTER work_status,
  MODIFY COLUMN work_status ENUM('Active','Inactive','Not a member','Expired') NOT NULL DEFAULT 'Active';

-- tbl_org_details: cached member_count to fix slow Organisation/firm-wise
-- dashboard page loads at 99k+ orgs. Kept in sync incrementally by
-- POST /api/voters/:id/work (only the affected org_id(s) are recomputed on
-- write); the dashboard read path just sorts/paginates this column instead
-- of GROUP BY-ing the whole work_history JOIN on every page load.
ALTER TABLE tbl_org_details
  ADD COLUMN member_count INT NOT NULL DEFAULT 0 COMMENT 'cached count of tbl_work_history rows with is_current=1 for this org',
  ADD KEY idx_org_member_count (member_count);

-- One-time backfill (no-op while tbl_work_history is empty, but correct once it isn't).
UPDATE tbl_org_details o
SET member_count = (SELECT COUNT(DISTINCT icai_membership_no) FROM tbl_work_history WHERE org_id = o.org_id AND is_current = 1);

-- tbl_work_history: simplified per follow-up feedback — firm_reg_no renamed
-- to org_reg_no (matches tbl_org_details' own column name, since it's a
-- snapshot of exactly that), from_date/to_date dropped (year precision is
-- enough), is_current dropped (work_status = 'Active' already means current,
-- a separate flag was redundant). Table was still empty, no data to migrate.
ALTER TABLE tbl_work_history
  CHANGE COLUMN firm_reg_no org_reg_no VARCHAR(100) NULL COMMENT 'snapshot of tbl_org_details.org_reg_no at time of entry',
  DROP COLUMN from_date,
  DROP COLUMN to_date,
  DROP COLUMN is_current;
ALTER TABLE tbl_work_history MODIFY COLUMN to_year YEAR DEFAULT NULL COMMENT 'NULL when work_status is Active';

-- tbl_voter_voting_history: absorbed tbl_voter's per-election-year detail
-- columns (voter_id, voter_booth_no, voter_type, voter_sub_type, voter_status)
-- instead of keeping "Voter Details" and "Voting History" as two separate
-- tables/sections with the same grain (icai_membership_no + election_year).
-- tbl_voter itself is CONFIRMED/locked, so it's left as-is and untouched —
-- this table is now the single source the app reads from for both. Both
-- tables were empty, no data to migrate.
ALTER TABLE tbl_voter_voting_history
  ADD COLUMN voter_id VARCHAR(50) NULL COMMENT 'ICAI-issued; changes across elections' AFTER election_year,
  ADD COLUMN voter_booth_no VARCHAR(50) NULL AFTER voter_id,
  ADD COLUMN voter_type ENUM('Booth','Postal') NULL AFTER voter_booth_no,
  ADD COLUMN voter_sub_type ENUM('Booth-Region','Booth-Other Region','Postal-Domestic','Postal-Foreign') NULL AFTER voter_type,
  ADD COLUMN voter_status ENUM('Active','Inactive','Blocked') NOT NULL DEFAULT 'Active' AFTER voter_sub_type,
  ADD KEY idx_vvh_booth (voter_booth_no);

-- Call list / meet list / competitor tagging + free-text labels — persisted
-- per explicit instruction, replacing the old stub buttons (quickMeet/
-- quickAddTodo) that just showed a toast with no DB write.
CREATE TABLE IF NOT EXISTS tbl_member_action_tag (
  tag_id BIGINT NOT NULL AUTO_INCREMENT,
  icai_membership_no VARCHAR(20) NOT NULL,
  tag_type ENUM('call_list','meet_list','competitor') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36) DEFAULT NULL,
  PRIMARY KEY (tag_id),
  UNIQUE KEY uq_member_tag (icai_membership_no, tag_type),
  KEY idx_tag_type (tag_type),
  CONSTRAINT fk_member_tag_member FOREIGN KEY (icai_membership_no) REFERENCES tbl_ca_member(icai_membership_no) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_member_tag_created_by FOREIGN KEY (created_by) REFERENCES tbl_app_user(user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Call list / meet list / competitor flags per member';

CREATE TABLE IF NOT EXISTS tbl_member_label (
  label_id BIGINT NOT NULL AUTO_INCREMENT,
  icai_membership_no VARCHAR(20) NOT NULL,
  label_text VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by CHAR(36) DEFAULT NULL,
  PRIMARY KEY (label_id),
  KEY idx_label_member (icai_membership_no),
  CONSTRAINT fk_member_label_member FOREIGN KEY (icai_membership_no) REFERENCES tbl_ca_member(icai_membership_no) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_member_label_created_by FOREIGN KEY (created_by) REFERENCES tbl_app_user(user_id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Free-text labels per member — multiple allowed';

-- Data fix (not a schema change): member_display_name had the literal text
-- "NULL" baked in as a separator between name segments for 19,831 of 19,966
-- members (e.g. "RATNAMNULLKNULLR" instead of "RATNAM K R") — an artifact
-- from however this column was originally populated, predating this project.
-- first/middle/last name columns are all NULL for these rows too, so there
-- was no better source to reconstruct from; replacing the literal "NULL"
-- substring with a space is the correct fix for the overwhelming majority
-- of cases (verified: no leading/trailing NULL, no doubled NULL, no
-- lowercase-only variant — it's a clean internal separator every time).
UPDATE tbl_ca_member SET member_display_name = TRIM(REPLACE(member_display_name, 'NULL', ' ')) WHERE member_display_name LIKE '%NULL%';
