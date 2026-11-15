import React, { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  LogOut,
  RefreshCw,
  Download,
  Search,
  Phone,
  Calendar,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  MailWarning,
  Loader2,
} from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { CLINIC_CONFIG } from '../config/clinicConfig';

export interface LeadRecord {
  id: string;
  type: 'appointment' | 'callback';
  name: string;
  phone: string;
  email?: string;
  patientType?: 'adult' | 'child' | 'family';
  service?: string;
  preferredDate?: string;
  preferredTimeSlot?: 'morning' | 'afternoon' | 'evening';
  bestTimeToCall?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  message?: string;
  consentGiven: boolean;
  consentTimestamp: string;
  status: 'new' | 'contacted' | 'booked' | 'closed';
  ownerNotes: string;
  emailNotified: boolean;
  createdAt: string;
}

interface AdminDashboardProps {
  onBackHome: () => void;
}

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const AUTO_REFRESH_MS = 30 * 1000; // 30 seconds

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackHome }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'appointment' | 'callback'>('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'new' | 'contacted' | 'booked' | 'closed'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Editable state per lead
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const lastActivityRef = useRef<number>(Date.now());

  // Track auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Automatic sign out after 30 minutes of inactivity
  useEffect(() => {
    if (!user) return;

    const resetTimer = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, resetTimer, { passive: true }));

    const interval = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current > INACTIVITY_TIMEOUT_MS) {
        signOut(auth).catch(() => {});
        setErrorMsg('You were automatically signed out after 30 minutes of inactivity.');
      }
    }, 15000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, resetTimer));
      window.clearInterval(interval);
    };
  }, [user]);

  const fetchLeads = useCallback(
    async (silent = false) => {
      if (!user) return;
      if (!silent) setLoading(true);
      setErrorMsg(null);

      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/admin/leads', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setErrorMsg(
            data.error ||
              'Access denied (403). Make sure OWNER_EMAIL in AI Studio Secrets matches your signed-in Google email.'
          );
          setLeads([]);
        } else {
          const fetchedLeads: LeadRecord[] = data.leads || [];
          setLeads(fetchedLeads);
          setDraftNotes((prev) => {
            const next = { ...prev };
            for (const item of fetchedLeads) {
              if (next[item.id] === undefined) {
                next[item.id] = item.ownerNotes || '';
              }
            }
            return next;
          });
        }
      } catch {
        if (!silent) {
          setErrorMsg('Could not load leads right now. Please check your connection.');
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [user]
  );

  // Initial load & 30-second auto-refresh
  useEffect(() => {
    if (!user) return;
    fetchLeads(false);

    const refreshInterval = window.setInterval(() => {
      fetchLeads(true);
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(refreshInterval);
  }, [user, fetchLeads]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setErrorMsg(null);
    try {
      await signInWithPopup(auth, googleProvider);
      lastActivityRef.current = Date.now();
    } catch {
      setErrorMsg('Google sign-in was cancelled or blocked by popup settings.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setLeads([]);
    setErrorMsg(null);
  };

  const handleUpdateLead = async (
    leadId: string,
    newStatus: LeadRecord['status'],
    notesToSave: string
  ) => {
    if (!user) return;
    setSavingId(leadId);
    setErrorMsg(null);
    setActionNotice(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          ownerNotes: notesToSave,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not update lead.');
      } else {
        setLeads((prev) =>
          prev.map((item) =>
            item.id === leadId
              ? { ...item, status: newStatus, ownerNotes: notesToSave }
              : item
          )
        );
        setActionNotice('Lead updated.');
        setTimeout(() => setActionNotice(null), 3000);
      }
    } catch {
      setErrorMsg('Network error while saving lead changes.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!user) return;
    setDeletingId(leadId);
    setErrorMsg(null);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/admin/leads/${encodeURIComponent(leadId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not delete lead.');
      } else {
        setLeads((prev) => prev.filter((item) => item.id !== leadId));
        setConfirmDeleteId(null);
        setActionNotice('Lead permanently deleted.');
        setTimeout(() => setActionNotice(null), 3000);
      }
    } catch {
      setErrorMsg('Network error while deleting lead.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCsv = async () => {
    if (!user) return;
    setErrorMsg(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/export', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || 'Could not export CSV.');
        return;
      }

      const csvText = await res.text();
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `clinic-leads-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setErrorMsg('Could not download CSV export.');
    }
  };

  const newLeadsCount = leads.filter((l) => l.status === 'new').length;

  const filteredLeads = leads.filter((lead) => {
    if (typeFilter !== 'all' && lead.type !== typeFilter) return false;
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const haystack = `${lead.name} ${lead.phone} ${lead.service || ''} ${
        lead.message || ''
      } ${lead.ownerNotes || ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#E6F4F1] text-[#0B2B3A] pb-20">
      {/* Top Admin Header */}
      <header className="bg-[#0B2B3A] text-[#FFFFFF] py-5 border-b border-[#0E7C86]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBackHome}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#FFFFFF]/10 hover:bg-[#FFFFFF]/20 text-[#FFFFFF] font-bold text-[15px] inline-flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Public website</span>
            </button>

            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#FFFFFF] leading-tight">
                Owner Lead Dashboard
              </h1>
              <p className="text-sm text-[#E6F4F1]">
                {CLINIC_CONFIG.clinicName} · Auto-refreshes every 30s
              </p>
            </div>
          </div>

          {user && (
            <div className="flex flex-wrap items-center gap-3">
              {/* New Leads Counter Badge */}
              <div className="bg-[#FF7A59] text-[#0B2B3A] font-extrabold px-3.5 py-2 rounded-xl text-[15px] tabular-nums">
                New leads: {newLeadsCount}
              </div>

              <span className="text-sm text-[#E6F4F1] hidden md:inline">
                {user.email}
              </span>

              <button
                type="button"
                onClick={handleSignOut}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0E7C86] text-[#FFFFFF] font-bold text-[15px] inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {!authReady ? (
          <div className="bg-[#FFFFFF] rounded-3xl p-12 text-center border border-[#0E7C86]/25">
            <Loader2 className="w-8 h-8 text-[#0E7C86] animate-spin mx-auto" />
            <p className="mt-3 font-bold text-[#0B2B3A]">Checking authentication...</p>
          </div>
        ) : !user ? (
          /* Owner Sign-In Card */
          <div className="max-w-lg mx-auto bg-[#FFFFFF] rounded-3xl p-8 sm:p-10 border border-[#0E7C86]/25 space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#E6F4F1] text-[#0E7C86] flex items-center justify-center mx-auto">
              <ShieldCheck className="w-8 h-8" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-[#0B2B3A]">
                Clinic owner sign-in
              </h2>
              <p className="text-[#0B2B3A]">
                Sign in with your verified Google account. The server checks your Firebase ID token on every request and grants access only to the configured <code className="font-bold">OWNER_EMAIL</code> secret.
              </p>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="bg-[#E6F4F1] border-2 border-[#0B2B3A] rounded-2xl p-4 text-left flex items-start gap-2.5"
              >
                <AlertCircle className="w-5 h-5 text-[#0B2B3A] shrink-0 mt-0.5" />
                <p className="caption-text font-bold text-[#0B2B3A]">{errorMsg}</p>
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="btn-coral w-full"
            >
              {signingIn ? (
                <>
                  <Loader2 className="w-5 h-5 text-[#0B2B3A] animate-spin" />
                  <span>Signing in with Google...</span>
                </>
              ) : (
                <span>Sign in with Google</span>
              )}
            </button>
          </div>
        ) : (
          /* Authenticated Owner View */
          <>
            {errorMsg && (
              <div
                role="alert"
                className="bg-[#FFFFFF] border-2 border-[#0B2B3A] rounded-2xl p-5 flex items-start gap-3"
              >
                <AlertCircle className="w-6 h-6 text-[#0B2B3A] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-[#0B2B3A]">{errorMsg}</p>
                  <p className="caption-text text-[#0B2B3A]">
                    Signed in as: <span className="font-bold">{user.email}</span>
                  </p>
                </div>
              </div>
            )}

            {actionNotice && (
              <div
                role="status"
                aria-live="polite"
                className="bg-[#FFFFFF] border border-[#0E7C86] rounded-2xl px-5 py-3.5 flex items-center gap-2.5"
              >
                <CheckCircle2 className="w-5 h-5 text-[#0E7C86] shrink-0" />
                <span className="font-bold text-[#0B2B3A]">{actionNotice}</span>
              </div>
            )}

            {/* Controls Bar: Search, Filters, Refresh, Export CSV */}
            <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#0E7C86]/25 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                <div className="relative flex-1">
                  <Search
                    className="w-4 h-4 text-[#0E7C86] absolute left-3.5 top-1/2 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    placeholder="Search name, phone, service or notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search leads"
                    className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl border border-[#0B2B3A]/20 text-[16px] text-[#0B2B3A]"
                  />
                </div>

                <select
                  aria-label="Filter by request type"
                  value={typeFilter}
                  onChange={(e) =>
                    setTypeFilter(e.target.value as 'all' | 'appointment' | 'callback')
                  }
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#0B2B3A]/20 bg-[#FFFFFF] text-[16px] font-semibold text-[#0B2B3A]"
                >
                  <option value="all">All types</option>
                  <option value="appointment">Appointments only</option>
                  <option value="callback">Callbacks only</option>
                </select>

                <select
                  aria-label="Filter by lead status"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value as 'all' | 'new' | 'contacted' | 'booked' | 'closed'
                    )
                  }
                  className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#0B2B3A]/20 bg-[#FFFFFF] text-[16px] font-semibold text-[#0B2B3A]"
                >
                  <option value="all">All statuses</option>
                  <option value="new">New ({newLeadsCount})</option>
                  <option value="contacted">Contacted</option>
                  <option value="booked">Booked</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => fetchLeads(false)}
                  disabled={loading}
                  className="btn-teal-outline !min-h-[44px] !py-2 !px-4"
                >
                  <RefreshCw
                    className={`w-4 h-4 text-[#0E7C86] ${loading ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="btn-teal !min-h-[44px] !py-2 !px-4"
                >
                  <Download className="w-4 h-4 text-[#FFFFFF]" aria-hidden="true" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Leads List */}
            {loading && leads.length === 0 ? (
              <div className="bg-[#FFFFFF] rounded-3xl p-12 text-center border border-[#0E7C86]/20">
                <Loader2 className="w-7 h-7 text-[#0E7C86] animate-spin mx-auto" />
                <p className="mt-3 font-bold text-[#0B2B3A]">Loading clinic leads...</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="bg-[#FFFFFF] rounded-3xl p-12 text-center border border-[#0E7C86]/20 space-y-2">
                <h3 className="text-xl font-bold text-[#0B2B3A]">No matching leads found</h3>
                <p className="caption-text text-[#0B2B3A]">
                  New appointment and callback requests submitted on the public website will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLeads.map((lead) => {
                  const currentNotes =
                    draftNotes[lead.id] !== undefined
                      ? draftNotes[lead.id]
                      : lead.ownerNotes || '';

                  return (
                    <article
                      key={lead.id}
                      className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#0E7C86]/25 space-y-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#E6F4F1] pb-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="font-extrabold text-[#0E7C86] text-[15px]">
                              {lead.type === 'appointment' ? 'Appointment Request' : 'Callback Request'}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="caption-text font-bold text-[#0B2B3A]">
                              Status: {lead.status.toUpperCase()}
                            </span>
                            {!lead.emailNotified && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1 caption-text font-bold text-[#0B2B3A] bg-[#FF7A59]/30 px-2.5 py-0.5 rounded-lg">
                                  <MailWarning className="w-3.5 h-3.5 text-[#0B2B3A]" />
                                  <span>Email failed / not configured</span>
                                </span>
                              </>
                            )}
                          </div>

                          <h3 className="text-xl font-extrabold text-[#0B2B3A]">
                            {lead.name}
                          </h3>

                          <div className="flex flex-wrap items-center gap-4 pt-1">
                            <a
                              href={`tel:${lead.phone}`}
                              className="inline-flex items-center gap-1.5 font-extrabold text-[#0E7C86] underline text-[17px]"
                            >
                              <Phone className="w-4 h-4" aria-hidden="true" />
                              <span>{lead.phone}</span>
                            </a>

                            {lead.email && (
                              <span className="caption-text text-[#0B2B3A]">
                                Email: {lead.email}
                              </span>
                            )}

                            <span className="caption-text text-[#0B2B3A] tabular-nums">
                              Received:{' '}
                              {lead.createdAt
                                ? new Date(lead.createdAt).toLocaleString('en-IN')
                                : 'Just now'}
                            </span>
                          </div>
                        </div>

                        {/* Status Selector */}
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor={`status-${lead.id}`}
                            className="caption-text font-bold text-[#0B2B3A]"
                          >
                            Status:
                          </label>
                          <select
                            id={`status-${lead.id}`}
                            value={lead.status}
                            disabled={savingId === lead.id}
                            onChange={(e) =>
                              handleUpdateLead(
                                lead.id,
                                e.target.value as LeadRecord['status'],
                                currentNotes
                              )
                            }
                            className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#0B2B3A]/25 bg-[#E6F4F1] font-bold text-[15px] text-[#0B2B3A]"
                          >
                            <option value="new">New</option>
                            <option value="contacted">Contacted</option>
                            <option value="booked">Booked</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#E6F4F1]/60 rounded-xl p-4">
                        {lead.type === 'appointment' ? (
                          <>
                            <div>
                              <span className="caption-text font-bold text-[#0E7C86] block">
                                Service &amp; Patient
                              </span>
                              <span className="font-bold text-[#0B2B3A] text-[16px]">
                                {lead.service || 'General check-up'} ({lead.patientType || 'adult'})
                              </span>
                            </div>
                            <div>
                              <span className="caption-text font-bold text-[#0E7C86] block">
                                Preferred Date &amp; Slot
                              </span>
                              <span className="font-bold text-[#0B2B3A] text-[16px] inline-flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-[#0E7C86]" />
                                {lead.preferredDate} · {lead.preferredTimeSlot}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div>
                            <span className="caption-text font-bold text-[#0E7C86] block">
                              Best Time to Call
                            </span>
                            <span className="font-bold text-[#0B2B3A] text-[16px]">
                              {lead.bestTimeToCall || 'Anytime'}
                            </span>
                          </div>
                        )}

                        <div className="sm:col-span-3">
                          <span className="caption-text font-bold text-[#0E7C86] block">
                            Visitor Message
                          </span>
                          <p className="text-[#0B2B3A] text-[16px] mt-0.5">
                            {lead.message ? lead.message : 'No additional message provided.'}
                          </p>
                        </div>
                      </div>

                      {/* Owner Notes + Save & Privacy Delete */}
                      <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-4 pt-1">
                        <div className="flex-1 space-y-1.5">
                          <label
                            htmlFor={`notes-${lead.id}`}
                            className="block caption-text font-bold text-[#0B2B3A]"
                          >
                            Owner reception notes (private)
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2.5">
                            <input
                              id={`notes-${lead.id}`}
                              type="text"
                              maxLength={500}
                              placeholder="Add reception call outcome or confirmed slot..."
                              value={currentNotes}
                              onChange={(e) =>
                                setDraftNotes((prev) => ({
                                  ...prev,
                                  [lead.id]: e.target.value,
                                }))
                              }
                              className="flex-1 min-h-[44px] px-4 py-2 rounded-xl border border-[#0B2B3A]/20 text-[16px] text-[#0B2B3A]"
                            />
                            <button
                              type="button"
                              disabled={savingId === lead.id}
                              onClick={() =>
                                handleUpdateLead(lead.id, lead.status, currentNotes)
                              }
                              className="btn-teal !min-h-[44px] !py-2 !px-4 shrink-0"
                            >
                              <Save className="w-4 h-4 text-[#FFFFFF]" aria-hidden="true" />
                              <span>{savingId === lead.id ? 'Saving...' : 'Save note'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Privacy Deletion Control */}
                        <div className="shrink-0">
                          {confirmDeleteId === lead.id ? (
                            <div className="flex items-center gap-2 bg-[#E6F4F1] p-2 rounded-xl border border-[#0B2B3A]">
                              <span className="caption-text font-bold text-[#0B2B3A] px-2">
                                Delete permanently?
                              </span>
                              <button
                                type="button"
                                disabled={deletingId === lead.id}
                                onClick={() => handleDeleteLead(lead.id)}
                                className="btn-coral !min-h-[40px] !py-1.5 !px-3"
                              >
                                {deletingId === lead.id ? 'Deleting...' : 'Confirm delete'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="btn-teal-outline !min-h-[40px] !py-1.5 !px-3"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(lead.id)}
                              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-[#0B2B3A]/20 text-[#0B2B3A] hover:bg-[#E6F4F1] caption-text font-bold inline-flex items-center gap-1.5 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-[#0E7C86]" aria-hidden="true" />
                              <span>Delete record</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
