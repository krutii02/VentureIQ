/**
 * exportData.js
 * Pure-JS CSV export for all three roles (FOUNDER, INVESTOR, ADMIN).
 * No external dependencies – uses Blob + URL.createObjectURL.
 */

import { profileAPI, startupsAPI, adminAPI, investorsAPI } from './api';

/* ── helpers ──────────────────────────────────────────────────────── */

/** Escape a single CSV cell value */
function esc(v) {
  if (v === null || v === undefined) return '';
  const s = String(v).replace(/"/g, '""');
  return /[,"\n\r]/.test(s) ? `"${s}"` : s;
}

/** Convert an array-of-objects to CSV rows */
function toCsvRows(rows) {
  if (!rows || rows.length === 0) return [['(no data)'].join(',')];
  const headers = Object.keys(rows[0]);
  return [
    headers.map(esc).join(','),
    ...rows.map(r => headers.map(h => esc(r[h])).join(','))
  ];
}

/** Build a labelled section block */
function section(title, rows) {
  return [
    '',
    `=== ${title} ===`,
    ...toCsvRows(rows),
  ];
}

/** Trigger a browser CSV download */
function download(filename, lines) {
  const csvContent = lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ── role-specific data gatherers ─────────────────────────────────── */

async function founderData(profile) {
  const lines = [
    `VentureIQ — Founder Data Export`,
    `Exported At: ${new Date().toLocaleString()}`,
    `Account: ${profile.name} <${profile.email}>`,
  ];

  /* Profile */
  lines.push(...section('Founder Profile', [{
    Name: profile.name,
    Email: profile.email,
    Role: profile.role,
    Company: profile.company || '',
    Bio: profile.bio || '',
    Phone: profile.phone || '',
    Location: profile.location || '',
    Website: profile.website || '',
    LinkedIn: profile.linkedin || '',
  }]));

  /* Startup info */
  try {
    const res = await startupsAPI.mine();
    if (res.data) {
      const s = res.data;
      lines.push(...section('My Startup', [{
        Name: s.name,
        Industry: s.industry,
        Stage: s.stage,
        Country: s.country,
        City: s.city || '',
        Founded_Year: s.founded_year,
        Revenue: s.revenue,
        Growth: s.growth,
        Team_Size: s.team_size,
        Valuation: s.valuation,
        Active_Users: s.active_users,
        AI_Score: s.score,
        Risk_Level: s.risk_level,
        Description: s.description || '',
        Tags: s.tags || '',
        Tech_Stack: s.tech_stack || '',
        Website: s.website || '',
      }]));
    }
  } catch { /* no startup yet */ }

  /* Incoming meeting requests */
  try {
    const res = await startupsAPI.getMeetings();
    const meetings = Array.isArray(res.data) ? res.data : [];
    if (meetings.length > 0) {
      lines.push(...section('Incoming Meeting Requests', meetings.map(m => ({
        Meeting_ID: m.id,
        Investor_Name: m.investor_name || '',
        Investor_Email: m.investor_email || '',
        Startup: m.startup_name || '',
        Message: m.message || '',
        Status: m.status,
        Created_At: m.created_at || '',
      }))));
    }
  } catch { /* no meetings */ }

  return lines;
}

async function investorData(profile) {
  const lines = [
    `VentureIQ — Investor Data Export`,
    `Exported At: ${new Date().toLocaleString()}`,
    `Account: ${profile.name} <${profile.email}>`,
  ];

  /* Profile */
  lines.push(...section('Investor Profile', [{
    Name: profile.name,
    Email: profile.email,
    Role: profile.role,
    Firm: profile.firm || '',
    Bio: profile.bio || '',
    Phone: profile.phone || '',
    Location: profile.location || '',
    Website: profile.website || '',
    LinkedIn: profile.linkedin || '',
    Investment_Thesis: profile.investment_thesis || '',
    Min_Ticket: profile.min_ticket || '',
    Max_Ticket: profile.max_ticket || '',
    Preferred_Industries: profile.preferred_industries || '',
    Preferred_Stages: profile.preferred_stages || '',
    Total_Investments: profile.total_investments || 0,
    Successful_Exits: profile.successful_exits || 0,
  }]));

  /* Watchlist */
  try {
    const res = await startupsAPI.getWatchlist();
    const wl = Array.isArray(res.data) ? res.data : [];
    if (wl.length > 0) {
      lines.push(...section('Watchlist', wl.map(w => ({
        Startup_Name: w.startup?.name || '',
        Industry: w.startup?.industry || '',
        Stage: w.startup?.stage || '',
        Country: w.startup?.country || '',
        AI_Score: w.startup?.score || '',
        Risk_Level: w.startup?.risk_level || '',
        Revenue: w.startup?.revenue || '',
        Growth: w.startup?.growth || '',
        Notes: w.notes || '',
        Added_At: w.created_at || '',
      }))));
    }
  } catch { /* no watchlist */ }

  /* Sent meeting requests */
  try {
    const res = await startupsAPI.getMeetingsSent();
    const meetings = Array.isArray(res.data) ? res.data : [];
    if (meetings.length > 0) {
      lines.push(...section('Meeting Requests Sent', meetings.map(m => ({
        Meeting_ID: m.id,
        Startup_Name: m.startup_name || m.startup?.name || '',
        Message: m.message || '',
        Status: m.status,
        Founder_Reply: m.founder_reply || '',
        Investor_Reply: m.investor_reply || '',
        Created_At: m.created_at || '',
      }))));
    }
  } catch { /* no meetings */ }

  return lines;
}

async function adminData(profile) {
  const lines = [
    `VentureIQ — Admin Data Export`,
    `Exported At: ${new Date().toLocaleString()}`,
    `Account: ${profile.name} <${profile.email}>`,
  ];

  /* Admin profile */
  lines.push(...section('Admin Account', [{
    Name: profile.name,
    Email: profile.email,
    Role: profile.role,
  }]));

  /* Platform stats */
  try {
    const res = await adminAPI.getStats();
    const s = res.data;
    lines.push(...section('Platform Statistics', [{
      Total_Users: s.total_users ?? '',
      Total_Startups: s.total_startups ?? '',
      Total_Meetings: s.total_meetings ?? '',
      Pending_Approvals: s.pending_approvals ?? '',
      Active_Investors: s.active_investors ?? '',
      Active_Founders: s.active_founders ?? '',
    }]));
  } catch { /* stats unavailable */ }

  /* All users */
  try {
    const res = await adminAPI.getUsers();
    const users = Array.isArray(res.data) ? res.data : (res.data?.users || []);
    if (users.length > 0) {
      lines.push(...section('All Users', users.map(u => ({
        ID: u.id,
        Name: u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim(),
        Email: u.email,
        Role: u.role || u.profile?.role || '',
        Company: u.company || u.profile?.company || '',
        Firm: u.firm || u.profile?.firm || '',
        Is_Active: u.is_active ?? true,
        Date_Joined: u.date_joined || '',
        Last_Login: u.last_login || '',
      }))));
    }
  } catch { /* no users */ }

  /* Pending approvals */
  try {
    const res = await adminAPI.getApprovals();
    const approvals = Array.isArray(res.data) ? res.data : [];
    if (approvals.length > 0) {
      lines.push(...section('Approval Queue', approvals.map(a => ({
        ID: a.id,
        Type: a.type || '',
        User: a.user_name || '',
        Email: a.user_email || '',
        Status: a.status || 'Pending',
        Submitted_At: a.submitted_at || '',
      }))));
    }
  } catch { /* no approvals */ }

  return lines;
}

/* ── main export function ─────────────────────────────────────────── */

export async function exportMyData(user) {
  try {
    /* Always fetch fresh profile */
    let profile = { ...user };
    try {
      const res = await profileAPI.get();
      if (res.data) profile = { ...profile, ...res.data };
    } catch { /* use cached user */ }

    const role = (profile.role || '').toUpperCase();
    let lines = [];
    let filename = '';

    if (role === 'FOUNDER') {
      lines = await founderData(profile);
      filename = `ventureiq_founder_export_${Date.now()}.csv`;
    } else if (role === 'INVESTOR') {
      lines = await investorData(profile);
      filename = `ventureiq_investor_export_${Date.now()}.csv`;
    } else {
      lines = await adminData(profile);
      filename = `ventureiq_admin_export_${Date.now()}.csv`;
    }

    download(filename, lines);
    return { success: true };
  } catch (err) {
    console.error('Export failed:', err);
    throw err;
  }
}
