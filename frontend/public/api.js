// frontend/public/api.js
// ─────────────────────────────────────────────────────────────────────────────
//  RelateMe — API Client
//  Wraps all fetch() calls to the Express backend.
//  The backend URL is read from window.RELATEME_API_BASE (set in index.html)
//  or falls back to http://localhost:4000.
// ─────────────────────────────────────────────────────────────────────────────

const API_BASE = window.RELATEME_API_BASE || 'http://localhost:4000';

// ── Token helpers ─────────────────────────────────────────────────────────────
const Auth = {
  getToken()         { return localStorage.getItem('rm_token'); },
  setToken(t)        { localStorage.setItem('rm_token', t); },
  clearToken()       { localStorage.removeItem('rm_token'); localStorage.removeItem('rm_user'); },
  getUser()          { try { return JSON.parse(localStorage.getItem('rm_user')); } catch { return null; } },
  setUser(u)         { localStorage.setItem('rm_user', JSON.stringify(u)); },
};

// ── Core fetch wrapper ────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token   = Auth.getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  // Only force a reload if a previously-valid token expired — never during login.
  if (res.status === 401 && Auth.getToken() && !path.includes('/auth/login')) {
    Auth.clearToken();
    window.location.reload();
    return;
  }

  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

// ── Auth API ──────────────────────────────────────────────────────────────────
const AuthAPI = {
  async login(email, password) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    Auth.setToken(data.token);
    Auth.setUser(data.user);
    return { user: data.user, needs_onboarding: !!data.needs_onboarding };
  },

  async checkEmail(email) {
    return apiFetch('/api/auth/check-email', {
      method: 'POST',
      body: { email },
    });
  },

  async completeOnboarding() {
    return apiFetch('/api/auth/complete-onboarding', { method: 'POST' });
  },

  async register(email, full_name, password, user_role) {
    return apiFetch('/api/auth/register', {
      method: 'POST',
      body: { email, full_name, password, user_role },
    });
  },

  async me() {
    return apiFetch('/api/auth/me');
  },

  logout() {
    Auth.clearToken();
  },
};

// ── Dashboard API ─────────────────────────────────────────────────────────────
const DashboardAPI = {
  async get()        { return apiFetch('/api/dashboard'); },
  // city/firm/institute are paginated — params: { page, limit, search, type, status, sort, dir }
  // type filters to an exact org_type ('CA'/'NON_CA') or institute_type
  // ('SCHOOL'/'COLLEGE'/'INSTITUTE'/'UNIVERSITY') — omit/empty for all types.
  // status filters to org_status/institute_status ('ACTIVE'/'INACTIVE') — firm/institute only.
  // sort: 'total'|'in_universe'|'not_in_universe'|'p1'|'p2'|'p3'|'p4'|'un' (default 'total')
  // dir: 'asc'|'desc' (default 'desc')
  async city(params = {})      { return apiFetch('/api/dashboard/city' + toQS(params)); },
  async firm(params = {})      { return apiFetch('/api/dashboard/firm' + toQS(params)); },
  async institute(params = {}) { return apiFetch('/api/dashboard/institute' + toQS(params)); },
};
function toQS(params){
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([,v]) => v !== '' && v !== null && v !== undefined))
  ).toString();
  return qs ? '?' + qs : '';
}

// ── Voters API ────────────────────────────────────────────────────────────────
const VotersAPI = {
  async list(params = {}) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([,v]) => v !== '' && v !== null && v !== undefined))
    ).toString();
    return apiFetch('/api/voters' + (qs ? '?' + qs : ''));
  },

  // Facet options + live counts for the filter sidebar, computed server-side
  // across the whole roll (not just the current page).
  async facets(params = {}) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([,v]) => v !== '' && v !== null && v !== undefined))
    ).toString();
    return apiFetch('/api/voters/facets' + (qs ? '?' + qs : ''));
  },

  async get(id)      { return apiFetch('/api/voters/' + id); },

  async updatePreference(id, { preference_tier, warmth, support_status }) {
    return apiFetch('/api/voters/' + id + '/preference', {
      method: 'PATCH',
      body: { preference_tier, warmth, support_status },
    });
  },

  async toggleDnd(id, reason) {
    return apiFetch('/api/voters/' + id + '/dnd', {
      method: 'POST',
      body: { reason },
    });
  },

  async logActivity(id, payload) {
    return apiFetch('/api/voters/' + id + '/activity', {
      method: 'POST',
      body: payload,
    });
  },

  async updateCop(id, cop_status) {
    return apiFetch('/api/voters/' + id + '/cop', {
      method: 'PATCH',
      body: { cop_status },
    });
  },

  // payload: { election_year, voted, voter_id?, voter_booth_no?, voter_type?, voter_sub_type?, voter_status? }
  // — one merged row per election year, both voter detail + whether they voted.
  async setVotingHistory(id, payload) {
    return apiFetch('/api/voters/' + id + '/voting-history', {
      method: 'PUT',
      body: payload,
    });
  },

  async deleteVotingHistory(id, year) {
    return apiFetch('/api/voters/' + id + '/voting-history/' + year, {
      method: 'DELETE',
    });
  },

  async addWork(id, payload) {
    return apiFetch('/api/voters/' + id + '/work', { method: 'POST', body: payload });
  },
  async editWork(id, whId, payload) {
    return apiFetch('/api/voters/' + id + '/work/' + whId, { method: 'PATCH', body: payload });
  },

  async addPhone(id, payload) {
    return apiFetch('/api/voters/' + id + '/phone', { method: 'POST', body: payload });
  },
  async editPhone(id, phoneId, payload) {
    return apiFetch('/api/voters/' + id + '/phone/' + phoneId, { method: 'PATCH', body: payload });
  },
  async addEmail(id, payload) {
    return apiFetch('/api/voters/' + id + '/email', { method: 'POST', body: payload });
  },
  async editEmail(id, emailId, payload) {
    return apiFetch('/api/voters/' + id + '/email/' + emailId, { method: 'PATCH', body: payload });
  },

  async addEducation(id, payload) {
    return apiFetch('/api/voters/' + id + '/education', { method: 'POST', body: payload });
  },
  async editEducation(id, eduHistId, payload) {
    return apiFetch('/api/voters/' + id + '/education/' + eduHistId, { method: 'PATCH', body: payload });
  },

  // Call list / meet list / competitor — persisted toggle tags.
  async setTag(id, tag_type, on) {
    return apiFetch('/api/voters/' + id + '/tag', { method: 'POST', body: { tag_type, on } });
  },
  async bulkTag(ids, tag_type) {
    return apiFetch('/api/voters/bulk-tag', { method: 'POST', body: { ids, tag_type } });
  },

  // Free-text labels (multiple per member).
  async addLabel(id, label_text) {
    return apiFetch('/api/voters/' + id + '/label', { method: 'POST', body: { label_text } });
  },
  async removeLabel(id, label_id) {
    return apiFetch('/api/voters/' + id + '/label/' + label_id, { method: 'DELETE' });
  },
  async bulkLabel(ids, label_text) {
    return apiFetch('/api/voters/bulk-label', { method: 'POST', body: { ids, label_text } });
  },
};

// ── Orgs API ──────────────────────────────────────────────────────────────────
const OrgsAPI = {
  // search by name or registration number — server caps results (typeahead source)
  async list(search = '') {
    const qs = search ? '?search=' + encodeURIComponent(search) : '';
    return apiFetch('/api/orgs' + qs);
  },
  async create(payload) {
    return apiFetch('/api/orgs', { method: 'POST', body: payload });
  },
  async updateStatus(orgId, org_status) {
    return apiFetch('/api/orgs/' + orgId + '/status', { method: 'PATCH', body: { org_status } });
  },
};

// ── Institutes API ────────────────────────────────────────────────────────────
const InstitutesAPI = {
  // search by name — server caps results (typeahead source)
  async list(search = '') {
    const qs = search ? '?search=' + encodeURIComponent(search) : '';
    return apiFetch('/api/institutes' + qs);
  },
  async create(payload) {
    return apiFetch('/api/institutes', { method: 'POST', body: payload });
  },
  async updateStatus(instituteId, institute_status) {
    return apiFetch('/api/institutes/' + instituteId + '/status', { method: 'PATCH', body: { institute_status } });
  },
};

// ── Universe API ────────────────────────────────────────────────────────────
const UniverseAPI = {
  async list()        { return apiFetch('/api/universe'); },
  async add(voterId)  { return apiFetch('/api/universe/' + voterId, { method: 'POST' }); },
  async addBulk(ids)  { return apiFetch('/api/universe', { method: 'POST', body: { ids } }); },
  async remove(voterId){ return apiFetch('/api/universe/' + voterId, { method: 'DELETE' }); },
};

// ── PVS API ───────────────────────────────────────────────────────────────────
const PvsAPI = {
  async recalcAll()     { return apiFetch('/api/pvs/recalculate', { method: 'POST' }); },
  async recalcOne(id)   { return apiFetch('/api/pvs/recalculate/' + id, { method: 'POST' }); },
  async preview(id)     { return apiFetch('/api/pvs/' + id); },
};

// ── Users API ─────────────────────────────────────────────────────────────────
const UsersAPI = {
  async list()       { return apiFetch('/api/users'); },
  async update(id, patch) {
    return apiFetch('/api/users/' + id, { method: 'PATCH', body: patch });
  },
  async resetPassword(id, new_password) {
    return apiFetch('/api/users/' + id + '/password', { method: 'PATCH', body: { new_password } });
  },
};

// ── Goals API ─────────────────────────────────────────────────────────────────
const GoalsAPI = {
  async get()        { return apiFetch('/api/goals'); },
  async save(payload){ return apiFetch('/api/goals', { method: 'POST', body: payload }); },
};

// ── Onboarding questionnaire API ───────────────────────────────────────────────
const OnboardingAPI = {
  async getProfile()  { return apiFetch('/api/onboarding/profile'); },
  async saveProfile(payload) { return apiFetch('/api/onboarding/profile', { method: 'PUT', body: payload }); },
};

// ── Global loading state ──────────────────────────────────────────────────────
function showLoader(msg = 'Loading…') {
  let el = document.getElementById('rm-global-loader');
  if (!el) {
    el = document.createElement('div');
    el.id = 'rm-global-loader';
    el.style.cssText =
      'position:fixed;top:0;left:0;right:0;height:3px;background:var(--accent);z-index:9999;animation:rmLoad 1.2s ease infinite';
    document.body.appendChild(el);
    const style = document.createElement('style');
    style.textContent = '@keyframes rmLoad{0%{width:0}80%{width:90%}100%{width:100%}}';
    document.head.appendChild(style);
  }
  el.style.display = 'block';
}
function hideLoader() {
  const el = document.getElementById('rm-global-loader');
  if (el) el.style.display = 'none';
}

// ── Toast notification ────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const existing = document.getElementById('rm-toast');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id = 'rm-toast';
  el.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    padding:12px 18px;border-radius:8px;font-size:13px;font-weight:500;
    box-shadow:0 4px 20px rgba(0,0,0,0.18);
    background:${type === 'error' ? '#C44B2A' : '#2A7A4B'};color:#fff;
    animation:slideIn .2s ease;
  `;
  const styleId = 'rm-toast-style';
  if (!document.getElementById(styleId)) {
    const s = document.createElement('style');
    s.id = styleId;
    s.textContent = '@keyframes slideIn{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}';
    document.head.appendChild(s);
  }
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}