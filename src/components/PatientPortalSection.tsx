import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  UserCheck,
  Calendar,
  FileText,
  HeartHandshake,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase';
import { CLINIC_CONFIG } from '../config/clinicConfig';
import { Reveal } from './Reveal';
import { AppointmentReminderPanel } from './AppointmentReminderPrompt';
import { upsertAppointmentReminder } from '../utils/appointmentReminders';

interface PatientAppointment {
  id: string;
  type: 'appointment' | 'callback';
  name: string;
  phone: string;
  patientType: 'adult' | 'child' | 'family';
  service: string;
  preferredDate: string;
  preferredTimeSlot: 'morning' | 'afternoon' | 'evening';
  status: 'new' | 'contacted' | 'booked' | 'closed';
  createdAt: string;
}

interface PatientHealthRecord {
  id: string;
  patientUid: string;
  patientName: string;
  visitDate: string;
  service: string;
  dentistName: string;
  toothArea: string;
  clinicalSummary: string;
  homeCareAdvice: string;
  nextCheckupDate: string;
  createdAt: string;
}

interface PatientComfortProfile {
  patientUid: string;
  displayName: string;
  phone: string;
  comfortPreference: string;
  sensitivityOrAllergyNote: string;
  familyMembersNote: string;
  lastCheckupDate: string;
  updatedAt: string;
}

interface PatientPortalSectionProps {
  onBookNewVisit: (preselectedService?: string) => void;
}

const NO_HTML_REGEX = /^[^<>]*$/;

export const PatientPortalSection: React.FC<PatientPortalSectionProps> = ({
  onBookNewVisit,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [portalNotice, setPortalNotice] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'appointments' | 'history' | 'comfort'>(
    'appointments'
  );

  // Live Firestore Data
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [healthRecords, setHealthRecords] = useState<PatientHealthRecord[]>([]);

  // Comfort Profile Form State
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [comfortPreference, setComfortPreference] = useState(
    'Apply numbing gel first and use hand-raise pause signal'
  );
  const [sensitivityNote, setSensitivityNote] = useState('');
  const [familyMembersNote, setFamilyMembersNote] = useState('');
  const [lastCheckupDate, setLastCheckupDate] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Add Health History Record Form State
  const [showAddRecordForm, setShowAddRecordForm] = useState(false);
  const [recPatientName, setRecPatientName] = useState('');
  const [recVisitDate, setRecVisitDate] = useState('2026-05-14');
  const [recService, setRecService] = useState(CLINIC_CONFIG.services[3].name);
  const [recDentist, setRecDentist] = useState(CLINIC_CONFIG.doctors[0].name);
  const [recToothArea, setRecToothArea] = useState('Full mouth & molars');
  const [recSummary, setRecSummary] = useState('');
  const [recAdvice, setRecAdvice] = useState('');
  const [recNextDate, setRecNextDate] = useState('2026-11-14');
  const [savingRecord, setSavingRecord] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.displayName) {
        setDisplayName(currentUser.displayName);
        setRecPatientName(currentUser.displayName);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Attach real-time Firestore listeners only when authenticated
  useEffect(() => {
    if (!authReady || !user) {
      setAppointments([]);
      setHealthRecords([]);
      return;
    }

    // 1. Listen to patient's appointments in /leads
    const leadsQuery = query(
      collection(db, 'leads'),
      where('patientUid', '==', user.uid)
    );
    const unsubLeads = onSnapshot(
      leadsQuery,
      (snap) => {
        const list: PatientAppointment[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              type: (data.type || 'appointment') as 'appointment' | 'callback',
              name: String(data.name || ''),
              phone: String(data.phone || ''),
              patientType: (data.patientType || 'family') as
                | 'adult'
                | 'child'
                | 'family',
              service: String(data.service || 'General family check-up'),
              preferredDate: String(data.preferredDate || ''),
              preferredTimeSlot: (data.preferredTimeSlot || 'morning') as
                | 'morning'
                | 'afternoon'
                | 'evening',
              status: (data.status || 'new') as
                | 'new'
                | 'contacted'
                | 'booked'
                | 'closed',
              createdAt: String(data.createdAt || ''),
            };
          })
          .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
        setAppointments(list);
        for (const item of list) {
          if (item.status !== 'closed' && item.preferredDate) {
            upsertAppointmentReminder({
              id: item.id,
              patientName: item.name,
              service: item.service,
              preferredDate: item.preferredDate,
              preferredTimeSlot: item.preferredTimeSlot,
              status: item.status,
              createdAt: item.createdAt || new Date().toISOString(),
            });
          }
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'leads');
      }
    );

    // 2. Listen to patient's dental health history in /patientRecords
    const recordsQuery = query(
      collection(db, 'patientRecords'),
      where('patientUid', '==', user.uid)
    );
    const unsubRecords = onSnapshot(
      recordsQuery,
      (snap) => {
        const recs: PatientHealthRecord[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              patientUid: String(data.patientUid || ''),
              patientName: String(data.patientName || ''),
              visitDate: String(data.visitDate || ''),
              service: String(data.service || ''),
              dentistName: String(data.dentistName || ''),
              toothArea: String(data.toothArea || ''),
              clinicalSummary: String(data.clinicalSummary || ''),
              homeCareAdvice: String(data.homeCareAdvice || ''),
              nextCheckupDate: String(data.nextCheckupDate || ''),
              createdAt: String(data.createdAt || ''),
            };
          })
          .sort((a, b) => (b.visitDate > a.visitDate ? 1 : -1));
        setHealthRecords(recs);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'patientRecords');
      }
    );

    // 3. Listen to patient's comfort & health profile in /patientProfiles/{uid}
    const profileRef = doc(db, 'patientProfiles', user.uid);
    const unsubProfile = onSnapshot(
      profileRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as PatientComfortProfile;
          setDisplayName(data.displayName || user.displayName || '');
          setPhone(data.phone || '');
          setComfortPreference(data.comfortPreference || '');
          setSensitivityNote(data.sensitivityOrAllergyNote || '');
          setFamilyMembersNote(data.familyMembersNote || '');
          setLastCheckupDate(data.lastCheckupDate || '');
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `patientProfiles/${user.uid}`);
      }
    );

    return () => {
      unsubLeads();
      unsubRecords();
      unsubProfile();
    };
  }, [authReady, user]);

  const handleSignIn = async () => {
    setSigningIn(true);
    setPortalError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setPortalError('Google sign-in was cancelled or blocked by popup settings.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setPortalNotice(null);
    setPortalError(null);
  };

  const handleSeedSampleHistory = async () => {
    if (!user) return;
    setSavingRecord(true);
    setPortalError(null);

    const recordId = `rec_${Date.now()}_sample`;
    const samplePayload: Omit<PatientHealthRecord, 'id'> = {
      patientUid: user.uid,
      patientName: (user.displayName || 'Family Member').slice(0, 80),
      visitDate: '2026-05-12',
      service: 'Child dental check-ups',
      dentistName: CLINIC_CONFIG.doctors[0].name,
      toothArea: 'All primary & first permanent molars',
      clinicalSummary:
        'Gentle check-up, plaque polish, and protective fluoride varnish completed comfortably with zero cavities found.',
      homeCareAdvice:
        'Brush twice daily with pea-sized fluoride toothpaste and floss back molars after evening meals.',
      nextCheckupDate: '2026-11-12',
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'patientRecords', recordId), samplePayload);
      setPortalNotice('Sample dental visit record added to your health history.');
      setTimeout(() => setPortalNotice(null), 3500);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `patientRecords/${recordId}`);
    } finally {
      setSavingRecord(false);
    }
  };

  const handleAddHealthRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPortalError(null);

    const cleanName = recPatientName.trim().slice(0, 80);
    const cleanSummary = recSummary.trim().slice(0, 500);
    const cleanAdvice = recAdvice.trim().slice(0, 500);
    const cleanArea = recToothArea.trim().slice(0, 80);

    if (
      cleanName.length < 2 ||
      cleanSummary.length < 2 ||
      cleanAdvice.length < 2 ||
      !NO_HTML_REGEX.test(cleanName) ||
      !NO_HTML_REGEX.test(cleanSummary) ||
      !NO_HTML_REGEX.test(cleanAdvice)
    ) {
      setPortalError(
        'Please fill in the patient name, summary, and care advice without HTML tags.'
      );
      return;
    }

    setSavingRecord(true);
    const recordId = `rec_${Date.now()}`;
    try {
      await setDoc(doc(db, 'patientRecords', recordId), {
        patientUid: user.uid,
        patientName: cleanName,
        visitDate: recVisitDate,
        service: recService.slice(0, 80),
        dentistName: recDentist.slice(0, 80),
        toothArea: cleanArea || 'General check-up',
        clinicalSummary: cleanSummary,
        homeCareAdvice: cleanAdvice,
        nextCheckupDate: recNextDate,
        createdAt: new Date().toISOString(),
      });
      setShowAddRecordForm(false);
      setRecSummary('');
      setRecAdvice('');
      setPortalNotice('Visit record saved to your health history.');
      setTimeout(() => setPortalNotice(null), 3500);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `patientRecords/${recordId}`);
    } finally {
      setSavingRecord(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    try {
      await deleteDoc(doc(db, 'patientRecords', recordId));
      setPortalNotice('Health history record removed.');
      setTimeout(() => setPortalNotice(null), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `patientRecords/${recordId}`);
    }
  };

  const handleSaveComfortProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setPortalError(null);

    const cleanName = (displayName.trim() || user.displayName || 'Patient').slice(0, 80);
    const cleanPhone = phone.trim().slice(0, 16);
    const cleanComfort = comfortPreference.trim().slice(0, 250);
    const cleanSensitivity = sensitivityNote.trim().slice(0, 300);
    const cleanFamily = familyMembersNote.trim().slice(0, 250);
    const cleanLastDate = lastCheckupDate.trim().slice(0, 20);

    if (
      !NO_HTML_REGEX.test(cleanName) ||
      !NO_HTML_REGEX.test(cleanComfort) ||
      !NO_HTML_REGEX.test(cleanSensitivity) ||
      !NO_HTML_REGEX.test(cleanFamily)
    ) {
      setPortalError('Please remove any HTML brackets (< or >) from your notes.');
      return;
    }

    setSavingProfile(true);
    try {
      await setDoc(doc(db, 'patientProfiles', user.uid), {
        patientUid: user.uid,
        displayName: cleanName,
        phone: cleanPhone,
        comfortPreference: cleanComfort,
        sensitivityOrAllergyNote: cleanSensitivity,
        familyMembersNote: cleanFamily,
        lastCheckupDate: cleanLastDate,
        updatedAt: new Date().toISOString(),
      });
      setPortalNotice('Your comfort & health preferences have been saved.');
      setTimeout(() => setPortalNotice(null), 3500);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `patientProfiles/${user.uid}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const statusSteps: Array<{ key: PatientAppointment['status']; label: string }> = [
    { key: 'new', label: '1. Request received' },
    { key: 'contacted', label: '2. Reception called' },
    { key: 'booked', label: '3. Slot confirmed' },
    { key: 'closed', label: '4. Visit completed' },
  ];

  return (
    <section
      id="patient-portal"
      aria-labelledby="portal-heading"
      className="bg-[#FFFFFF] py-16 lg:py-24 border-t border-[#0E7C86]/15"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 text-[#0E7C86] font-bold text-[16px]">
                <UserCheck className="w-5 h-5 text-[#0E7C86]" aria-hidden="true" />
                <span>Secure patient &amp; family portal</span>
              </div>
              <h2 id="portal-heading">
                Track your <span className="heading-highlight">upcoming</span> visits and dental health history
              </h2>
              <p className="text-[#0B2B3A]">
                Sign in with your Google account to check live appointment status, review past visit summaries and 6-month check-up reminders, or save chairside comfort preferences for nervous family members.
              </p>
            </div>

            {user && (
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <span className="caption-text font-bold text-[#0B2B3A]">
                  Signed in as {user.displayName || user.email}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="btn-teal-outline !min-h-[44px] !py-2 !px-4"
                >
                  <LogOut className="w-4 h-4 text-[#0E7C86]" aria-hidden="true" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </Reveal>

        {!authReady ? (
          <div className="bg-[#E6F4F1] rounded-3xl p-10 text-center border border-[#0E7C86]/20">
            <Loader2 className="w-7 h-7 text-[#0E7C86] animate-spin mx-auto" />
            <p className="mt-2 font-bold text-[#0B2B3A]">Loading patient portal...</p>
          </div>
        ) : !user ? (
          /* Signed-Out Patient Login Card */
          <Reveal delayMs={60}>
            <div className="bg-[#E6F4F1] rounded-3xl p-6 sm:p-10 border border-[#0E7C86]/25 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <h3 className="text-2xl font-extrabold text-[#0B2B3A]">
                  One private login for your whole family’s dental care
                </h3>
                <ul className="space-y-2.5 text-[#0B2B3A]">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#0E7C86] shrink-0 mt-1" />
                    <span>
                      <strong>Live appointment status:</strong> See when reception has reviewed and confirmed your requested slot.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#0E7C86] shrink-0 mt-1" />
                    <span>
                      <strong>Dental visit &amp; health history:</strong> Keep track of past check-ups, fluoride treatments, sealants, and next recall dates.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-[#0E7C86] shrink-0 mt-1" />
                    <span>
                      <strong>Chairside comfort preferences:</strong> Tell your dentist ahead of time if you or your child prefer numbing gel or extra quiet breaks.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-5 bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#0E7C86]/20 space-y-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#E6F4F1] text-[#0E7C86] flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-7 h-7" aria-hidden="true" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xl font-extrabold text-[#0B2B3A]">
                    Patient sign-in
                  </h4>
                  <p className="caption-text text-[#0B2B3A]">
                    Protected by Firebase Authentication &amp; strict per-patient Firestore rules.
                  </p>
                </div>

                {portalError && (
                  <div
                    role="alert"
                    className="bg-[#E6F4F1] border border-[#0B2B3A] rounded-xl p-3 text-left caption-text font-bold text-[#0B2B3A]"
                  >
                    {portalError}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSignIn}
                  disabled={signingIn}
                  className="btn-coral w-full"
                >
                  {signingIn ? (
                    <>
                      <Loader2 className="w-5 h-5 text-[#0B2B3A] animate-spin" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <span>Sign in with Google</span>
                  )}
                </button>
              </div>
            </div>
          </Reveal>
        ) : (
          /* Signed-In Patient Portal Workspace */
          <div className="bg-[#E6F4F1] rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#0E7C86]/25 space-y-8">
            {/* Portal Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#0E7C86]/20 pb-5">
              <div
                role="tablist"
                aria-label="Patient portal sections"
                className="flex flex-wrap gap-2"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'appointments'}
                  onClick={() => setActiveTab('appointments')}
                  className={`min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-[16px] inline-flex items-center gap-2 transition-colors ${
                    activeTab === 'appointments'
                      ? 'bg-[#0E7C86] text-[#FFFFFF]'
                      : 'bg-[#FFFFFF] text-[#0B2B3A] hover:bg-[#FFFFFF]/80'
                  }`}
                >
                  <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Upcoming appointments ({appointments.length})</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'history'}
                  onClick={() => setActiveTab('history')}
                  className={`min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-[16px] inline-flex items-center gap-2 transition-colors ${
                    activeTab === 'history'
                      ? 'bg-[#0E7C86] text-[#FFFFFF]'
                      : 'bg-[#FFFFFF] text-[#0B2B3A] hover:bg-[#FFFFFF]/80'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Dental health history ({healthRecords.length})</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'comfort'}
                  onClick={() => setActiveTab('comfort')}
                  className={`min-h-[44px] px-4 py-2.5 rounded-xl font-bold text-[16px] inline-flex items-center gap-2 transition-colors ${
                    activeTab === 'comfort'
                      ? 'bg-[#0E7C86] text-[#FFFFFF]'
                      : 'bg-[#FFFFFF] text-[#0B2B3A] hover:bg-[#FFFFFF]/80'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Comfort &amp; health notes</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => onBookNewVisit()}
                className="btn-coral !min-h-[44px] !py-2 !px-4"
              >
                <Calendar className="w-4 h-4 text-[#0B2B3A]" aria-hidden="true" />
                <span>Book a new visit</span>
              </button>
            </div>

            {portalNotice && (
              <div
                role="status"
                aria-live="polite"
                className="bg-[#FFFFFF] border border-[#0E7C86] rounded-2xl px-5 py-3.5 flex items-center gap-2.5"
              >
                <CheckCircle2 className="w-5 h-5 text-[#0E7C86] shrink-0" />
                <span className="font-bold text-[#0B2B3A]">{portalNotice}</span>
              </div>
            )}

            {portalError && (
              <div
                role="alert"
                className="bg-[#FFFFFF] border-2 border-[#0B2B3A] rounded-2xl px-5 py-3.5 flex items-center gap-2.5"
              >
                <AlertCircle className="w-5 h-5 text-[#0B2B3A] shrink-0" />
                <span className="font-bold text-[#0B2B3A]">{portalError}</span>
              </div>
            )}

            {/* TAB 1: UPCOMING APPOINTMENTS & STATUS TRACKER */}
            {activeTab === 'appointments' && (
              <div className="space-y-4">
                {appointments.length === 0 ? (
                  <div className="bg-[#FFFFFF] rounded-2xl p-8 text-center border border-[#0E7C86]/20 space-y-4">
                    <Calendar className="w-10 h-10 text-[#0E7C86] mx-auto" />
                    <div className="space-y-1">
                      <h3 className="text-xl font-extrabold text-[#0B2B3A]">
                        No appointments linked to your account yet
                      </h3>
                      <p className="text-[#0B2B3A] max-w-xl mx-auto">
                        While you are signed in, any appointment you submit in the booking form below is automatically linked to your portal so you can track its confirmation status here.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onBookNewVisit('Child dental check-ups')}
                      className="btn-coral"
                    >
                      <Calendar className="w-4 h-4 text-[#0B2B3A]" aria-hidden="true" />
                      <span>Book an appointment now</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {appointments.map((appt) => {
                      const currentStepIdx = statusSteps.findIndex(
                        (s) => s.key === appt.status
                      );
                      return (
                        <article
                          key={appt.id}
                          className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#0E7C86]/20 space-y-5"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <span className="caption-text font-extrabold text-[#0E7C86]">
                                {appt.type === 'appointment'
                                  ? 'Appointment request'
                                  : 'Callback request'}{' '}
                                · For {appt.patientType}
                              </span>
                              <h3 className="text-xl font-extrabold text-[#0B2B3A] mt-0.5">
                                {appt.service} — {appt.name}
                              </h3>
                              <p className="caption-text text-[#0B2B3A] mt-1 inline-flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-[#0E7C86]" />
                                <span>
                                  Preferred schedule: <strong>{appt.preferredDate}</strong> (
                                  {appt.preferredTimeSlot})
                                </span>
                              </p>
                            </div>

                            <div className="bg-[#E6F4F1] px-4 py-2 rounded-xl border border-[#0E7C86]/25">
                              <span className="caption-text font-extrabold text-[#0B2B3A]">
                                Current status: {appt.status.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {/* 4-Step Visual Status Progress Tracker */}
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2">
                            {statusSteps.map((step, idx) => {
                              const isCompletedOrActive = idx <= currentStepIdx;
                              return (
                                <div
                                  key={step.key}
                                  className={`rounded-xl px-3.5 py-2.5 border text-sm font-bold flex items-center gap-2 ${
                                    isCompletedOrActive
                                      ? 'bg-[#0E7C86] text-[#FFFFFF] border-[#0E7C86]'
                                      : 'bg-[#E6F4F1]/60 text-[#0B2B3A] border-[#0B2B3A]/15'
                                  }`}
                                >
                                  <CheckCircle2
                                    className={`w-4 h-4 shrink-0 ${
                                      isCompletedOrActive
                                        ? 'text-[#FFFFFF]'
                                        : 'text-[#0E7C86]/40'
                                    }`}
                                  />
                                  <span>{step.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DENTAL HEALTH & VISIT HISTORY */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[#0B2B3A] font-semibold">
                    Your family’s dental check-up summaries, treated tooth notes, and 6-month preventive recall dates:
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {healthRecords.length === 0 && (
                      <button
                        type="button"
                        disabled={savingRecord}
                        onClick={handleSeedSampleHistory}
                        className="btn-teal-outline !min-h-[44px] !py-2 !px-4"
                      >
                        <Sparkles className="w-4 h-4 text-[#0E7C86]" />
                        <span>Load sample check-up record</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowAddRecordForm((prev) => !prev)}
                      className="btn-teal !min-h-[44px] !py-2 !px-4"
                    >
                      <Plus className="w-4 h-4 text-[#FFFFFF]" />
                      <span>
                        {showAddRecordForm ? 'Close form' : 'Add visit record'}
                      </span>
                    </button>
                  </div>
                </div>

                {showAddRecordForm && (
                  <form
                    onSubmit={handleAddHealthRecord}
                    className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#0E7C86] space-y-4"
                  >
                    <h4 className="text-lg font-extrabold text-[#0B2B3A]">
                      Log a dental visit or check-up summary
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label
                          htmlFor="rec-patient-name"
                          className="block caption-text font-bold text-[#0B2B3A] mb-1"
                        >
                          Family member name *
                        </label>
                        <input
                          id="rec-patient-name"
                          type="text"
                          required
                          maxLength={80}
                          value={recPatientName}
                          onChange={(e) => setRecPatientName(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#0B2B3A]/25 text-[16px]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="rec-visit-date"
                          className="block caption-text font-bold text-[#0B2B3A] mb-1"
                        >
                          Visit date *
                        </label>
                        <input
                          id="rec-visit-date"
                          type="date"
                          required
                          value={recVisitDate}
                          onChange={(e) => setRecVisitDate(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#0B2B3A]/25 text-[16px]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="rec-next-date"
                          className="block caption-text font-bold text-[#0B2B3A] mb-1"
                        >
                          Next 6-month recall date *
                        </label>
                        <input
                          id="rec-next-date"
                          type="date"
                          required
                          value={recNextDate}
                          onChange={(e) => setRecNextDate(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#0B2B3A]/25 text-[16px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label
                          htmlFor="rec-service"
                          className="block caption-text font-bold text-[#0B2B3A] mb-1"
                        >
                          Treatment / Service *
                        </label>
                        <select
                          id="rec-service"
                          value={recService}
                          onChange={(e) => setRecService(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#0B2B3A]/25 bg-[#FFFFFF] text-[16px]"
                        >
                          {CLINIC_CONFIG.services.map((s) => (
                            <option key={s.id} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="rec-dentist"
                          className="block caption-text font-bold text-[#0B2B3A] mb-1"
                        >
                          Dentist *
                        </label>
                        <select
                          id="rec-dentist"
                          value={recDentist}
                          onChange={(e) => setRecDentist(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#0B2B3A]/25 bg-[#FFFFFF] text-[16px]"
                        >
                          {CLINIC_CONFIG.doctors.map((d) => (
                            <option key={d.id} value={d.name}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="rec-area"
                          className="block caption-text font-bold text-[#0B2B3A] mb-1"
                        >
                          Tooth / Area examined *
                        </label>
                        <input
                          id="rec-area"
                          type="text"
                          required
                          maxLength={80}
                          value={recToothArea}
                          onChange={(e) => setRecToothArea(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#0B2B3A]/25 text-[16px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="rec-summary"
                          className="block caption-text font-bold text-[#0B2B3A] mb-1"
                        >
                          Visit summary &amp; findings *
                        </label>
                        <textarea
                          id="rec-summary"
                          rows={2}
                          required
                          maxLength={500}
                          placeholder="e.g. Routine cleaning & fluoride application completed."
                          value={recSummary}
                          onChange={(e) => setRecSummary(e.target.value)}
                          className="w-full p-3 rounded-xl border border-[#0B2B3A]/25 text-[16px]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="rec-advice"
                          className="block caption-text font-bold text-[#0B2B3A] mb-1"
                        >
                          Home-care &amp; brushing advice *
                        </label>
                        <textarea
                          id="rec-advice"
                          rows={2}
                          required
                          maxLength={500}
                          placeholder="e.g. Use soft-bristle brush twice daily."
                          value={recAdvice}
                          onChange={(e) => setRecAdvice(e.target.value)}
                          className="w-full p-3 rounded-xl border border-[#0B2B3A]/25 text-[16px]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <button
                        type="submit"
                        disabled={savingRecord}
                        className="btn-coral !min-h-[44px] !py-2 !px-5"
                      >
                        {savingRecord ? 'Saving...' : 'Save visit record'}
                      </button>
                    </div>
                  </form>
                )}

                {healthRecords.length === 0 ? (
                  <div className="bg-[#FFFFFF] rounded-2xl p-8 text-center border border-[#0E7C86]/20 space-y-3">
                    <FileText className="w-10 h-10 text-[#0E7C86] mx-auto" />
                    <h3 className="text-xl font-extrabold text-[#0B2B3A]">
                      No dental visit history records yet
                    </h3>
                    <p className="text-[#0B2B3A] max-w-xl mx-auto">
                      Click <strong>Load sample check-up record</strong> above to see how visit summaries and 6-month recall reminders appear, or log your family’s past dental visits.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {healthRecords.map((rec) => (
                      <article
                        key={rec.id}
                        className="bg-[#FFFFFF] rounded-2xl p-6 border border-[#0E7C86]/20 flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3 border-b border-[#E6F4F1] pb-3">
                            <div>
                              <span className="caption-text font-extrabold text-[#0E7C86] tabular-nums">
                                Visit date: {rec.visitDate} · {rec.dentistName}
                              </span>
                              <h3 className="text-xl font-extrabold text-[#0B2B3A]">
                                {rec.service} ({rec.patientName})
                              </h3>
                              <p className="caption-text text-[#0B2B3A]">
                                Area examined: <strong>{rec.toothArea}</strong>
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteRecord(rec.id)}
                              aria-label={`Delete health record from ${rec.visitDate}`}
                              className="min-w-[40px] min-h-[40px] rounded-xl border border-[#0B2B3A]/15 inline-flex items-center justify-center text-[#0B2B3A] hover:bg-[#E6F4F1]"
                            >
                              <Trash2 className="w-4 h-4 text-[#0E7C86]" />
                            </button>
                          </div>

                          <div className="space-y-2 text-[16px] text-[#0B2B3A]">
                            <p>
                              <strong>Clinical summary:</strong> {rec.clinicalSummary}
                            </p>
                            <p>
                              <strong>Home-care advice:</strong> {rec.homeCareAdvice}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#E6F4F1] flex flex-wrap items-center justify-between gap-2">
                          <span className="caption-text font-extrabold text-[#0E7C86] tabular-nums">
                            Next check-up due: {rec.nextCheckupDate}
                          </span>
                          <button
                            type="button"
                            onClick={() => onBookNewVisit(rec.service)}
                            className="caption-text font-extrabold text-[#0B2B3A] underline hover:text-[#0E7C86]"
                          >
                            Book follow-up visit
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CHAIRSIDE COMFORT & HEALTH PREFERENCES */}
            {activeTab === 'comfort' && (
              <form
                onSubmit={handleSaveComfortProfile}
                className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#0E7C86]/20 space-y-5"
              >
                <div className="space-y-1 border-b border-[#E6F4F1] pb-4">
                  <h3 className="text-xl font-extrabold text-[#0B2B3A]">
                    Your chairside comfort &amp; dental health profile
                  </h3>
                  <p className="caption-text text-[#0B2B3A]">
                    Saved privately to your account so your dentist knows how to make your family feel at ease before you sit in the chair.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label
                      htmlFor="prof-name"
                      className="block font-bold text-[#0B2B3A] text-[16px] mb-1.5"
                    >
                      Your name
                    </label>
                    <input
                      id="prof-name"
                      type="text"
                      maxLength={80}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-[#0B2B3A]/25 text-[16px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="prof-phone"
                      className="block font-bold text-[#0B2B3A] text-[16px] mb-1.5"
                    >
                      Preferred phone number
                    </label>
                    <input
                      id="prof-phone"
                      type="tel"
                      maxLength={16}
                      placeholder="e.g. 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-[#0B2B3A]/25 text-[16px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="prof-last-visit"
                      className="block font-bold text-[#0B2B3A] text-[16px] mb-1.5"
                    >
                      Last dental check-up (approx.)
                    </label>
                    <input
                      id="prof-last-visit"
                      type="text"
                      maxLength={20}
                      placeholder="e.g. May 2026"
                      value={lastCheckupDate}
                      onChange={(e) => setLastCheckupDate(e.target.value)}
                      className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-[#0B2B3A]/25 text-[16px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="prof-comfort"
                      className="block font-bold text-[#0B2B3A] text-[16px] mb-1.5"
                    >
                      Chairside comfort preferences
                    </label>
                    <textarea
                      id="prof-comfort"
                      rows={3}
                      maxLength={250}
                      placeholder="e.g. Please explain each step before starting, apply numbing gel for 2 minutes, and allow hand-raise breaks."
                      value={comfortPreference}
                      onChange={(e) => setComfortPreference(e.target.value)}
                      className="w-full p-4 rounded-xl border border-[#0B2B3A]/25 text-[16px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="prof-sensitivity"
                      className="block font-bold text-[#0B2B3A] text-[16px] mb-1.5"
                    >
                      Tooth sensitivities or allergies to note
                    </label>
                    <textarea
                      id="prof-sensitivity"
                      rows={3}
                      maxLength={300}
                      placeholder="e.g. Cold water sensitivity on lower left molar; prefers lukewarm rinse water."
                      value={sensitivityNote}
                      onChange={(e) => setSensitivityNote(e.target.value)}
                      className="w-full p-4 rounded-xl border border-[#0B2B3A]/25 text-[16px]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="prof-family"
                    className="block font-bold text-[#0B2B3A] text-[16px] mb-1.5"
                  >
                    Family members in household (optional)
                  </label>
                  <input
                    id="prof-family"
                    type="text"
                    maxLength={250}
                    placeholder="e.g. Aarav (Age 6, loves dinosaur stickers), Grandmother Lakshmi (wheelchair access)"
                    value={familyMembersNote}
                    onChange={(e) => setFamilyMembersNote(e.target.value)}
                    className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-[#0B2B3A]/25 text-[16px]"
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="btn-coral"
                  >
                    {savingProfile ? 'Saving preferences...' : 'Save comfort & health profile'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Service-Worker & Interval-Based Browser Notification Reminder System */}
        <Reveal delayMs={80}>
          <AppointmentReminderPanel />
        </Reveal>
      </div>
    </section>
  );
};
