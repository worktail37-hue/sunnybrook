import React, { useEffect, useState } from 'react';
import {
  Phone,
  MapPin,
  Clock,
  MessageCircle,
  Calendar,
  PhoneCall,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import { CLINIC_CONFIG } from '../config/clinicConfig';
import { Reveal } from './Reveal';
import { auth } from '../firebase';
import {
  upsertAppointmentReminder,
  requestAppointmentNotificationPermission,
} from '../utils/appointmentReminders';

interface ContactSectionProps {
  selectedService: string;
  onOpenPrivacyPolicy: () => void;
}

const PHONE_REGEX = /^(?:\+91[\s-]?)?[6-9]\d{9}$/;
const HTML_TAG_REGEX = /<[^>]*>|javascript:|on\w+=/i;

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  selectedService,
  onOpenPrivacyPolicy,
}) => {
  const [activeTab, setActiveTab] = useState<'appointment' | 'callback'>('appointment');
  const [formLoadedAt, setFormLoadedAt] = useState<number>(() => Date.now());

  // Appointment Form State
  const [apptName, setApptName] = useState('');
  const [apptPhone, setApptPhone] = useState('');
  const [apptEmail, setApptEmail] = useState('');
  const [apptPatientType, setApptPatientType] = useState<'adult' | 'child' | 'family'>('family');
  const [apptService, setApptService] = useState<string>(
    selectedService || CLINIC_CONFIG.services[0].name
  );
  const [apptDate, setApptDate] = useState<string>(() => getTodayDateString());
  const [apptSlot, setApptSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [apptMessage, setApptMessage] = useState('');
  const [apptConsent, setApptConsent] = useState(false);
  const [apptHoneypot, setApptHoneypot] = useState('');
  const [apptErrors, setApptErrors] = useState<Record<string, string>>({});
  const [apptSubmitting, setApptSubmitting] = useState(false);
  const [apptSuccess, setApptSuccess] = useState(false);
  const [apptServerError, setApptServerError] = useState<string | null>(null);

  // Callback Form State
  const [cbName, setCbName] = useState('');
  const [cbPhone, setCbPhone] = useState('');
  const [cbBestTime, setCbBestTime] = useState<'morning' | 'afternoon' | 'evening' | 'anytime'>(
    'morning'
  );
  const [cbReason, setCbReason] = useState('');
  const [cbConsent, setCbConsent] = useState(false);
  const [cbHoneypot, setCbHoneypot] = useState('');
  const [cbErrors, setCbErrors] = useState<Record<string, string>>({});
  const [cbSubmitting, setCbSubmitting] = useState(false);
  const [cbSuccess, setCbSuccess] = useState(false);
  const [cbServerError, setCbServerError] = useState<string | null>(null);

  // Sync preselected service when user clicks "Book this" on a service card
  useEffect(() => {
    if (selectedService) {
      setApptService(selectedService);
      setActiveTab('appointment');
      if (selectedService === 'Child dental check-ups' || selectedService === 'Dental sealants') {
        setApptPatientType('child');
      }
    }
  }, [selectedService]);

  const validateAppointment = (): boolean => {
    const errs: Record<string, string> = {};
    const trimmedName = apptName.trim();
    const cleanedPhone = apptPhone.trim().replace(/\s+/g, '');
    const trimmedEmail = apptEmail.trim();
    const trimmedMsg = apptMessage.trim();

    if (trimmedName.length < 2 || trimmedName.length > 80) {
      errs.name = 'Please enter your full name (2 to 80 characters).';
    } else if (HTML_TAG_REGEX.test(trimmedName)) {
      errs.name = 'Please enter letters and spaces only, without HTML tags.';
    }

    if (!PHONE_REGEX.test(cleanedPhone)) {
      errs.phone = 'Please enter a valid 10-digit Indian mobile number (optional +91).';
    }

    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Please enter a valid email address or leave this field blank.';
    }

    const todayStr = getTodayDateString();
    if (!apptDate || apptDate < todayStr) {
      errs.preferredDate = 'Please pick today or a future date for your visit.';
    }

    if (trimmedMsg.length > 500) {
      errs.message = 'Please keep your message under 500 characters.';
    } else if (HTML_TAG_REGEX.test(trimmedMsg)) {
      errs.message = 'Please do not include HTML tags or scripts in your message.';
    }

    if (!apptConsent) {
      errs.consent = 'Please tick the box to agree to our Privacy Policy before submitting.';
    }

    setApptErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApptServerError(null);

    if (!validateAppointment()) return;

    setApptSubmitting(true);
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: apptName.trim(),
          phone: apptPhone.trim(),
          email: apptEmail.trim() || auth.currentUser?.email || undefined,
          patientUid: auth.currentUser?.uid || undefined,
          patientType: apptPatientType,
          service: apptService,
          preferredDate: apptDate,
          preferredTimeSlot: apptSlot,
          message: apptMessage.trim() || undefined,
          consentGiven: apptConsent,
          honeypot: apptHoneypot,
          formLoadedAt,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setApptServerError(
          data.error ||
            'We could not save your request right now. Please call us directly on the number below.'
        );
      } else {
        upsertAppointmentReminder({
          id: `booked_${Date.now()}`,
          patientName: apptName.trim(),
          service: apptService,
          preferredDate: apptDate,
          preferredTimeSlot: apptSlot,
          status: 'new',
          createdAt: new Date().toISOString(),
        });
        setApptSuccess(true);
      }
    } catch {
      setApptServerError(
        'Network connection issue. Please call us directly on our clinic phone number below.'
      );
    } finally {
      setApptSubmitting(false);
    }
  };

  const validateCallback = (): boolean => {
    const errs: Record<string, string> = {};
    const trimmedName = cbName.trim();
    const cleanedPhone = cbPhone.trim().replace(/\s+/g, '');
    const trimmedReason = cbReason.trim();

    if (trimmedName.length < 2 || trimmedName.length > 80) {
      errs.name = 'Please enter your name (2 to 80 characters).';
    } else if (HTML_TAG_REGEX.test(trimmedName)) {
      errs.name = 'Please enter letters and spaces only, without HTML tags.';
    }

    if (!PHONE_REGEX.test(cleanedPhone)) {
      errs.phone = 'Please enter a valid 10-digit Indian mobile number (optional +91).';
    }

    if (trimmedReason.length > 500) {
      errs.message = 'Please keep your note under 500 characters.';
    } else if (HTML_TAG_REGEX.test(trimmedReason)) {
      errs.message = 'Please do not include HTML tags or scripts.';
    }

    if (!cbConsent) {
      errs.consent = 'Please tick the box to agree to our Privacy Policy before submitting.';
    }

    setCbErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCbServerError(null);

    if (!validateCallback()) return;

    setCbSubmitting(true);
    try {
      const response = await fetch('/api/callbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cbName.trim(),
          phone: cbPhone.trim(),
          patientUid: auth.currentUser?.uid || undefined,
          bestTimeToCall: cbBestTime,
          message: cbReason.trim() || undefined,
          consentGiven: cbConsent,
          honeypot: cbHoneypot,
          formLoadedAt,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setCbServerError(
          data.error ||
            'We could not send your callback request right now. Please call us directly below.'
        );
      } else {
        setCbSuccess(true);
      }
    } catch {
      setCbServerError(
        'Network connection issue. Please call us directly on our clinic phone number below.'
      );
    } finally {
      setCbSubmitting(false);
    }
  };

  const whatsappUrl = `https://wa.me/${CLINIC_CONFIG.whatsappNumber}?text=${encodeURIComponent(
    CLINIC_CONFIG.whatsappDefaultMessage
  )}`;

  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="bg-[#E6F4F1] py-16 lg:py-24 border-t border-[#0E7C86]/15"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <Reveal>
          <div className="max-w-3xl space-y-3">
            <p className="text-[16px] font-bold text-[#0B2B3A]">
              Book a visit or ask for a quick call
            </p>
            <h2 id="contact-heading">
              Ready for a <span className="heading-highlight">relaxed</span> dental visit?
            </h2>
            <p className="text-[#0B2B3A]">
              Choose an appointment time below, request a quick phone callback, or call our reception directly. We confirm every booking by phone.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Appointment Form & Callback Form (7 columns) */}
          <div className="lg:col-span-7 bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 lg:p-10 border border-[#0E7C86]/25">
            {/* Mode Switcher Tabs */}
            <div
              role="tablist"
              aria-label="Choose booking or callback form"
              className="grid grid-cols-2 gap-2 p-1.5 bg-[#E6F4F1] rounded-2xl mb-6"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'appointment'}
                onClick={() => {
                  setActiveTab('appointment');
                  setFormLoadedAt(Date.now() - 3500);
                }}
                className={`min-h-[48px] rounded-xl font-bold text-[16px] inline-flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'appointment'
                    ? 'bg-[#0E7C86] text-[#FFFFFF]'
                    : 'text-[#0B2B3A] hover:bg-[#FFFFFF]/60'
                }`}
              >
                <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Book appointment</span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'callback'}
                onClick={() => {
                  setActiveTab('callback');
                  setFormLoadedAt(Date.now() - 3500);
                }}
                className={`min-h-[48px] rounded-xl font-bold text-[16px] inline-flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'callback'
                    ? 'bg-[#0E7C86] text-[#FFFFFF]'
                    : 'text-[#0B2B3A] hover:bg-[#FFFFFF]/60'
                }`}
              >
                <PhoneCall className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Request callback</span>
              </button>
            </div>

            {/* Mandatory Privacy Notice on Forms */}
            <div className="mb-6 bg-[#E6F4F1] rounded-xl p-4 border border-[#0E7C86]/20 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-[#0E7C86] shrink-0 mt-0.5" aria-hidden="true" />
              <p className="caption-text font-semibold text-[#0B2B3A]">
                Please do not share medical records, ID numbers or card numbers here.
              </p>
            </div>

            {/* Live Status Region */}
            <div aria-live="polite" aria-atomic="true">
              {/* APPOINTMENT FORM */}
              {activeTab === 'appointment' && (
                <>
                  {apptSuccess ? (
                    <div className="bg-[#E6F4F1] rounded-2xl p-8 border border-[#0E7C86] text-center space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#0E7C86] text-[#FFFFFF] flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
                      </div>
                      <h3 className="text-2xl font-extrabold text-[#0B2B3A]">
                        Thank you, we will call you soon
                      </h3>
                      <p className="text-[#0B2B3A]">
                        We have received your appointment request for{' '}
                        <span className="font-bold">{apptService}</span>. Our reception team will call{' '}
                        <span className="font-bold">{apptPhone}</span> shortly to confirm your exact time.
                      </p>
                      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => requestAppointmentNotificationPermission()}
                          className="btn-coral"
                        >
                          <span>Allow browser reminder for this visit</span>
                        </button>
                        <a href={`tel:${CLINIC_CONFIG.phoneTel}`} className="btn-teal">
                          <Phone className="w-4 h-4" aria-hidden="true" />
                          <span>Need urgent care? Call {CLINIC_CONFIG.phoneDisplay}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setApptSuccess(false);
                            setApptMessage('');
                            setFormLoadedAt(Date.now());
                          }}
                          className="btn-teal-outline"
                        >
                          Book another visit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleAppointmentSubmit} noValidate className="space-y-5">
                      {apptServerError && (
                        <div
                          role="alert"
                          className="bg-[#E6F4F1] border-2 border-[#0B2B3A] rounded-2xl p-4 space-y-2"
                        >
                          <div className="flex items-start gap-2.5">
                            <AlertCircle
                              className="w-5 h-5 text-[#0B2B3A] shrink-0 mt-0.5"
                              aria-hidden="true"
                            />
                            <p className="font-bold text-[#0B2B3A] text-[16px]">
                              {apptServerError}
                            </p>
                          </div>
                          <p className="caption-text text-[#0B2B3A] pl-7">
                            Please call us directly at{' '}
                            <a
                              href={`tel:${CLINIC_CONFIG.phoneTel}`}
                              className="font-extrabold text-[#0E7C86] underline"
                            >
                              {CLINIC_CONFIG.phoneDisplay}
                            </a>{' '}
                            and we will book your slot right away.
                          </p>
                        </div>
                      )}

                      {/* Honeypot field (hidden from screen readers and visual users) */}
                      <div className="hidden" aria-hidden="true">
                        <label htmlFor="appt-website-url">Leave this field empty</label>
                        <input
                          id="appt-website-url"
                          name="website_url"
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                          value={apptHoneypot}
                          onChange={(e) => setApptHoneypot(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label
                            htmlFor="appt-name"
                            className="block font-bold text-[#0B2B3A] text-[16px] mb-1.5"
                          >
                            Full name <span className="text-[#0E7C86]">*</span>
                          </label>
                          <input
                            id="appt-name"
                            type="text"
                            required
                            maxLength={80}
                            autoComplete="name"
                            placeholder="e.g. Meera Krishnan"
                            value={apptName}
                            onChange={(e) => setApptName(e.target.value)}
                            aria-invalid={Boolean(apptErrors.name)}
                            aria-describedby={apptErrors.name ? 'appt-name-err' : undefined}
                            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-[#0B2B3A]/25 bg-[#FFFFFF] text-[#0B2B3A] text-[17px]"
                          />
                          {apptErrors.name && (
                            <p
                              id="appt-name-err"
                              className="mt-1.5 caption-text font-bold text-[#0B2B3A] flex items-center gap-1.5"
                            >
                              <AlertCircle className="w-4 h-4 text-[#0E7C86] shrink-0" />
                              <span>{apptErrors.name}</span>
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="appt-phone"
                            className="block font-bold text-[#0B2B3A] text-[16px] mb-1.5"
                          >
                            Phone number (10 digits) <span className="text-[#0E7C86]">*</span>
                          </label>
                          <input
                            id="appt-phone"
                            type="tel"
                            required
                            maxLength={16}
                            autoComplete="tel"
                            placeholder="e.g. 98765 43210"
                            value={apptPhone}
                            onChange={(e) => setApptPhone(e.target.value)}
                            aria-invalid={Boolean(apptErrors.phone)}
                            aria-describedby={apptErrors.phone ? 'appt-phone-err' : undefined}
                            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-[#0B2B3A]/25 bg-[#FFFFFF] text-[#0B2B3A] text-[17px]"
                          />
                          {apptErrors.phone && (
                            <p
                              id="appt-phone-err"
                              className="mt-1.5 caption-text font-bold text-[#0B2B3A] flex items-center gap-1.5"
                            >
                              <AlertCircle className="w-4 h-4 text-[#0E7C86] shrink-0" />
                              <span>{apptErrors.phone}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label
                            htmlFor="appt-email"
                            className="block font-bold text-[#0B2B3A] text-[16px] mb-1.5"
                          >
                            Email address <span className="caption-text font-normal">(optional)</span>
                          </label>
                          <input
                            id="appt-email"
                            type="email"
                            maxLength={120}
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={apptEmail}
                            onChange={(e) => setApptEmail(e.target.value)}
                            aria-invalid={Boolean(apptErrors.email)}
                            aria-describedby={apptErrors.email ? 'appt-email-err' : undefined}
                            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-[#0B2B3A]/25 bg-[#FFFFFF] text-[#0B2B3A] text-[17px]"
                          />
                          {apptErrors.email && (
                            <p
                              id="appt-email-err"
                              className="mt-1.5 caption-text font-bold text-[#0B2B3A] flex items-center gap-1.5"
                            >
                              <AlertCircle className="w-4 h-4 text-[#0E7C86] shrink-0" />
                              <span>{apptErrors.email}</span>
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="appt-patient-type"
                            className="block font-bold text-[#0B2B3A] text-[16px] mb-1.5"
                          >
                            Who is this visit for? <span className="text-[#0E7C86]">*</span>
                          </label>
                          <select
                            id="appt-patient-type"
                            value={apptPatientType}
                            onChange={(e) =>
                              setApptPatientType(e.target.value as 'adult' | 'child' | 'family')
                            }
                            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-[#0B2B3A]/25 bg-[#FFFFFF] text-[#0B2B3A] text-[17px]"
                          >
                            <option value="family">Whole family / Multiple members</option>
                            <option value="child">Child or teenager</option>
                            <option value="adult">Adult or senior patient</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div className="sm:col-span-1">
                          <label
                            htmlFor="appt-service"
                            className="block font-bold text-[#0B2B3A] text-[16px] mb-1.5"
                          >
                            Service needed <span className="text-[#0E7C86]">*</span>
                          </label>
                          <select
                            id="appt-service"
                            value={apptService}
                            onChange={(e) => setApptService(e.target.value)}
                            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-[#0B2B3A]/25 bg-[#FFFFFF] text-[#0B2B3A] text-[16px]"
                          >
                            {CLINIC_CONFIG.services.map((s) => (
                              <option key={s.id} value={s.name}>
                                {s.number}. {s.name}
                              </option>
                            ))}
                            <option value="General family check-up">General family check-up</option>
                          </select>
                        </div>

                        <div>
                          <label
                            htmlFor="appt-date"
                            className="block font-bold text-[#0B2B3A] text-[16px] mb-1.5"
                          >
                            Preferred date <span className="text-[#0E7C86]">*</span>
                          </label>
                          <input
                            id="appt-date"
                            type="date"
                            required
                            min={getTodayDateString()}
                            value={apptDate}
                            onChange={(e) => setApptDate(e.target.value)}
                            aria-invalid={Boolean(apptErrors.preferredDate)}
                            aria-describedby={
                              apptErrors.preferredDate ? 'appt-date-err' : undefined
                            }
                            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-[#0B2B3A]/25 bg-[#FFFFFF] text-[#0B2B3A] text-[16px]"
                          />
                          {apptErrors.preferredDate && (
                            <p
                              id="appt-date-err"
                              className="mt-1.5 caption-text font-bold text-[#0B2B3A]"
                            >
                              {apptErrors.preferredDate}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="appt-slot"
                            className="block font-bold text-[#0B2B3A] text-[16px] mb-1.5"
                          >
                            Time slot <span className="text-[#0E7C86]">*</span>
                          </label>
                          <select
                            id="appt-slot"
                            value={apptSlot}
                            onChange={(e) =>
                              setApptSlot(e.target.value as 'morning' | 'afternoon' | 'evening')
                            }
                            className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-[#0B2B3A]/25 bg-[#FFFFFF] text-[#0B2B3A] text-[16px]"
                          >
                            <option value="morning">Morning (9:30 am – 1:00 pm)</option>
                            <option value="afternoon">Afternoon (1:00 pm – 4:30 pm)</option>
                            <option value="evening">Evening (4:30 pm – 8:00 pm)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="appt-message"
                            className="block font-bold text-[#0B2B3A] text-[16px]"
                          >
                            Short note <span className="caption-text font-normal">(optional)</span>
                          </label>
                          <span className="caption-text tabular-nums text-[#0B2B3A]">
                            {apptMessage.length}/500
                          </span>
                        </div>
                        <textarea
                          id="appt-message"
                          rows={3}
                          maxLength={500}
                          placeholder="Let us know if anyone feels nervous, needs wheelchair access, or has tooth pain."
                          value={apptMessage}
                          onChange={(e) => setApptMessage(e.target.value)}
                          aria-invalid={Boolean(apptErrors.message)}
                          aria-describedby={apptErrors.message ? 'appt-msg-err' : undefined}
                          className="w-full p-4 rounded-xl border border-[#0B2B3A]/25 bg-[#FFFFFF] text-[#0B2B3A] text-[17px]"
                        />
                        {apptErrors.message && (
                          <p
                            id="appt-msg-err"
                            className="mt-1.5 caption-text font-bold text-[#0B2B3A]"
                          >
                            {apptErrors.message}
                          </p>
                        )}
                      </div>

                      {/* Required DPDP Act Consent Checkbox */}
                      <div className="pt-1">
                        <label
                          htmlFor="appt-consent"
                          className="flex items-start gap-3 cursor-pointer select-none"
                        >
                          <input
                            id="appt-consent"
                            type="checkbox"
                            checked={apptConsent}
                            onChange={(e) => setApptConsent(e.target.checked)}
                            aria-invalid={Boolean(apptErrors.consent)}
                            className="mt-1 w-5 h-5 accent-[#0E7C86] rounded shrink-0"
                          />
                          <span className="caption-text text-[#0B2B3A]">
                            I consent to {CLINIC_CONFIG.clinicName} collecting my name, phone number
                            and visit preference to contact me about this appointment, as explained in
                            the{' '}
                            <button
                              type="button"
                              onClick={onOpenPrivacyPolicy}
                              className="font-bold text-[#0E7C86] underline hover:text-[#0B2B3A]"
                            >
                              Privacy Policy
                            </button>
                            . <span className="text-[#0E7C86] font-bold">*</span>
                          </span>
                        </label>
                        {apptErrors.consent && (
                          <p className="mt-1.5 caption-text font-bold text-[#0B2B3A] flex items-center gap-1.5">
                            <AlertCircle className="w-4 h-4 text-[#0E7C86] shrink-0" />
                            <span>{apptErrors.consent}</span>
                          </p>
                        )}
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={apptSubmitting}
                          className="btn-coral w-full sm:w-auto min-w-[240px]"
                        >
                          {apptSubmitting ? (
                            <>
                              <Loader2
                                className="w-5 h-5 text-[#0B2B3A] animate-spin"
                                aria-hidden="true"
                              />
                              <span>Sending request...</span>
                            </>
                          ) : (
                            <>
                              <Calendar className="w-5 h-5 text-[#0B2B3A]" aria-hidden="true" />
                              <span>Book appointment</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {/* CALLBACK FORM */}
              {activeTab === 'callback' && (
                <>
                  {cbSuccess ? (
                    <div className="bg-[#E6F4F1] rounded-2xl p-8 border border-[#0E7C86] text-center space-y-4">
                      <div className="w-14 h-14 rounded-2xl bg-[#0E7C86] text-[#FFFFFF] flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8" aria-hidden="true" />
                      </div>
                      <h3 className="text-2xl font-extrabold text-[#0B2B3A]">
                        Thank you, we will call you soon
                      </h3>
                      <p className="text-[#0B2B3A]">
                        We have received your callback request for{' '}
                        <span className="font-bold">{cbPhone}</span> ({cbBestTime}). Our reception
                        team will call you shortly.
                      </p>
                      <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
                        <a href={`tel:${CLINIC_CONFIG.phoneTel}`} className="btn-teal">
                          <Phone className="w-4 h-4" aria-hidden="true" />
                          <span>Call us now: {CLINIC_CONFIG.phoneDisplay}</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setCbSuccess(false);
                            setCbReason('');
                            setFormLoadedAt(Date.now());
                          }}
                          className="btn-teal-outline"
                        >
                          Send another request
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleCallbackSubmit} noValidate className="space-y-5">
                      {cbServerError && (
                        <div
                          role="alert"
                          className="bg-[#E6F4F1] border-2 border-[#0B2B3A] rounded-2xl p-4 space-y-2"
                        >
                          <div className="flex items-start gap-2.5">
                            <AlertCircle
                              className="w-5 h-5 text-[#0B2B3A] shrink-0 mt-0.5"
                              aria-hidden="true"
                            />
                            <p className="font-bold text-[#0B2B3A] text-[16px]">{cbServerError}</p>
                          </div>
                          <p className="caption-text text-[#0B2B3A] pl-7">
                            Please call us directly at{' '}
                            <a
                              href={`tel:${CLINIC_CONFIG.phoneTel}`}
                              className="font-extrabold text-[#0E7C86] underline"
                            >
                              {CLINIC_CONFIG.phoneDisplay}
                            </a>
                            .
                          </p>
                        </div>
                      )}

                      {/* Honeypot field */}
                      <div className="hidden" aria-hidden="true">
                        <label htmlFor="cb-website-url">Leave this field empty</label>
                        <input
                          id="cb-website-url"
                          name="website_url"
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                          value={cbHoneypot}
                          onChange={(e) => setCbHoneypot(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label
                            htmlFor="cb-name"
                            className="block font-bold text-[#0B2B3A] text-[16px] mb-1.5"
                          >
                            Your name <span className="text-[#0E7C86]">*</span>
                          </label>
                          <input
                            id="cb-name"
                            type="text"
                            required
                            maxLength={80}
                            autoComplete="name"
                            placeholder="e.g. Rajesh Nair"
                            value={cbName}
                            onChange={(e) => setCbName(e.target.value)}
                            aria-invalid={Boolean(cbErrors.name)}
                            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-[#0B2B3A]/25 bg-[#FFFFFF] text-[#0B2B3A] text-[17px]"
                          />
                          {cbErrors.name && (
                            <p className="mt-1.5 caption-text font-bold text-[#0B2B3A]">
                              {cbErrors.name}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="cb-phone"
                            className="block font-bold text-[#0B2B3A] text-[16px] mb-1.5"
                          >
                            Phone number (10 digits) <span className="text-[#0E7C86]">*</span>
                          </label>
                          <input
                            id="cb-phone"
                            type="tel"
                            required
                            maxLength={16}
                            autoComplete="tel"
                            placeholder="e.g. 98765 43210"
                            value={cbPhone}
                            onChange={(e) => setCbPhone(e.target.value)}
                            aria-invalid={Boolean(cbErrors.phone)}
                            className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-[#0B2B3A]/25 bg-[#FFFFFF] text-[#0B2B3A] text-[17px]"
                          />
                          {cbErrors.phone && (
                            <p className="mt-1.5 caption-text font-bold text-[#0B2B3A]">
                              {cbErrors.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="cb-best-time"
                          className="block font-bold text-[#0B2B3A] text-[16px] mb-1.5"
                        >
                          Best time to call you <span className="text-[#0E7C86]">*</span>
                        </label>
                        <select
                          id="cb-best-time"
                          value={cbBestTime}
                          onChange={(e) =>
                            setCbBestTime(
                              e.target.value as 'morning' | 'afternoon' | 'evening' | 'anytime'
                            )
                          }
                          className="w-full min-h-[48px] px-4 py-2.5 rounded-xl border border-[#0B2B3A]/25 bg-[#FFFFFF] text-[#0B2B3A] text-[17px]"
                        >
                          <option value="morning">Morning (9:30 am – 1:00 pm)</option>
                          <option value="afternoon">Afternoon (1:00 pm – 4:30 pm)</option>
                          <option value="evening">Evening (4:30 pm – 8:00 pm)</option>
                          <option value="anytime">Anytime during clinic hours</option>
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label
                            htmlFor="cb-reason"
                            className="block font-bold text-[#0B2B3A] text-[16px]"
                          >
                            How can we help?{' '}
                            <span className="caption-text font-normal">(optional)</span>
                          </label>
                          <span className="caption-text tabular-nums text-[#0B2B3A]">
                            {cbReason.length}/500
                          </span>
                        </div>
                        <textarea
                          id="cb-reason"
                          rows={3}
                          maxLength={500}
                          placeholder="e.g. Question about child's first check-up or toothache slot today"
                          value={cbReason}
                          onChange={(e) => setCbReason(e.target.value)}
                          className="w-full p-4 rounded-xl border border-[#0B2B3A]/25 bg-[#FFFFFF] text-[#0B2B3A] text-[17px]"
                        />
                        {cbErrors.message && (
                          <p className="mt-1.5 caption-text font-bold text-[#0B2B3A]">
                            {cbErrors.message}
                          </p>
                        )}
                      </div>

                      <div className="pt-1">
                        <label
                          htmlFor="cb-consent"
                          className="flex items-start gap-3 cursor-pointer select-none"
                        >
                          <input
                            id="cb-consent"
                            type="checkbox"
                            checked={cbConsent}
                            onChange={(e) => setCbConsent(e.target.checked)}
                            className="mt-1 w-5 h-5 accent-[#0E7C86] rounded shrink-0"
                          />
                          <span className="caption-text text-[#0B2B3A]">
                            I consent to {CLINIC_CONFIG.clinicName} calling me on the number
                            provided in line with the{' '}
                            <button
                              type="button"
                              onClick={onOpenPrivacyPolicy}
                              className="font-bold text-[#0E7C86] underline hover:text-[#0B2B3A]"
                            >
                              Privacy Policy
                            </button>
                            . <span className="text-[#0E7C86] font-bold">*</span>
                          </span>
                        </label>
                        {cbErrors.consent && (
                          <p className="mt-1.5 caption-text font-bold text-[#0B2B3A]">
                            {cbErrors.consent}
                          </p>
                        )}
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={cbSubmitting}
                          className="btn-coral w-full sm:w-auto min-w-[240px]"
                        >
                          {cbSubmitting ? (
                            <>
                              <Loader2
                                className="w-5 h-5 text-[#0B2B3A] animate-spin"
                                aria-hidden="true"
                              />
                              <span>Requesting callback...</span>
                            </>
                          ) : (
                            <>
                              <PhoneCall className="w-5 h-5 text-[#0B2B3A]" aria-hidden="true" />
                              <span>Call me back</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Column: Address, Map Placeholder, Working Hours, WhatsApp & Phone (5 columns) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Direct Phone & WhatsApp Card */}
            <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#0E7C86]/25 space-y-5">
              <h3 className="text-[#0B2B3A]">Prefer to talk right away?</h3>
              <p className="text-[#0B2B3A]">
                Call our reception desk directly or send us a message on WhatsApp for quick help with directions or urgent toothache slots.
              </p>

              <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                <a
                  href={`tel:${CLINIC_CONFIG.phoneTel}`}
                  className="btn-teal w-full justify-center"
                >
                  <Phone className="w-5 h-5 text-[#FFFFFF]" aria-hidden="true" />
                  <span>Call {CLINIC_CONFIG.phoneDisplay}</span>
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-teal-outline w-full justify-center"
                >
                  <MessageCircle className="w-5 h-5 text-[#0E7C86]" aria-hidden="true" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Address & Map Placeholder Card */}
            <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#0E7C86]/25 space-y-5">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-[#E6F4F1] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-5 h-5 text-[#0E7C86]" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-[20px] font-bold text-[#0B2B3A]">Clinic address</h3>
                  <p className="text-[#0B2B3A] mt-1">{CLINIC_CONFIG.address.fullDisplay}</p>
                  <p className="caption-text text-[#0B2B3A] mt-1">
                    {CLINIC_CONFIG.address.landmarkNote}
                  </p>
                </div>
              </div>

              {/* Accessible Map Placeholder Slot (avoids third-party tracking cookies until clicked) */}
              <div className="rounded-2xl bg-[#E6F4F1] border border-[#0E7C86]/25 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0B2B3A] text-[16px]">
                    Interactive map &amp; directions
                  </span>
                  <span className="caption-text text-[#0E7C86] font-bold">
                    {CLINIC_CONFIG.address.neighborhood}
                  </span>
                </div>
                <p className="caption-text text-[#0B2B3A]">
                  {/* PLACEHOLDER: Replace mapDirectionsUrl in src/config/clinicConfig.ts with your clinic's Google Maps link */}
                  We do not embed automatic third-party map trackers on load so your connection stays fast and private.
                </p>
                <a
                  href={CLINIC_CONFIG.mapDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-teal-outline w-full !min-h-[44px]"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-4 h-4 text-[#0E7C86]" aria-hidden="true" />
                </a>
              </div>

              {/* Working Hours */}
              <div className="pt-2 border-t border-[#E6F4F1] space-y-3">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-5 h-5 text-[#0E7C86]" aria-hidden="true" />
                  <h3 className="text-[20px] font-bold text-[#0B2B3A]">Working hours</h3>
                </div>
                <dl className="space-y-2">
                  {CLINIC_CONFIG.workingHours.schedule.map((item) => (
                    <div
                      key={item.days}
                      className="flex flex-col sm:flex-row sm:justify-between text-[16px] text-[#0B2B3A]"
                    >
                      <dt className="font-bold">{item.days}</dt>
                      <dd>{item.hours}</dd>
                    </div>
                  ))}
                </dl>
                <p className="caption-text font-semibold text-[#0E7C86] pt-1">
                  {CLINIC_CONFIG.workingHours.emergencyNote}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
