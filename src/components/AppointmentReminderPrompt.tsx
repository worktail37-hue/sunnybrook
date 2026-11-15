import React, { useEffect, useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  Clock,
  Calendar,
  Phone,
  X,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { CLINIC_CONFIG } from '../config/clinicConfig';
import {
  ActiveInAppAlert,
  ReminderPreferences,
  ScheduledAppointmentReminder,
  dispatchAppointmentNotification,
  evaluateDueAppointmentReminders,
  formatSlotLabel,
  getBrowserNotificationPermission,
  loadReminderPreferences,
  loadScheduledReminders,
  registerAppointmentServiceWorker,
  removeAppointmentReminder,
  requestAppointmentNotificationPermission,
  saveReminderPreferences,
  subscribeToInAppAlerts,
  subscribeToReminderUpdates,
  upsertAppointmentReminder,
} from '../utils/appointmentReminders';

function getTomorrowDateString(): string {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const AppointmentReminderPanel: React.FC = () => {
  const [prefs, setPrefs] = useState<ReminderPreferences>(() =>
    loadReminderPreferences()
  );
  const [reminders, setReminders] = useState<ScheduledAppointmentReminder[]>(() =>
    loadScheduledReminders()
  );
  const [browserPermission, setBrowserPermission] = useState<
    NotificationPermission | 'unsupported'
  >(() => getBrowserNotificationPermission());
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add custom reminder form state
  const [patientName, setPatientName] = useState('Family Member');
  const [service, setService] = useState(CLINIC_CONFIG.services[3].name);
  const [preferredDate, setPreferredDate] = useState(() => getTomorrowDateString());
  const [preferredTimeSlot, setPreferredTimeSlot] = useState<
    'morning' | 'afternoon' | 'evening'
  >('morning');

  useEffect(() => {
    registerAppointmentServiceWorker();
    const syncState = () => {
      setPrefs(loadReminderPreferences());
      setReminders(loadScheduledReminders());
      setBrowserPermission(getBrowserNotificationPermission());
    };
    return subscribeToReminderUpdates(syncState);
  }, []);

  const handleEnableNotifications = async () => {
    const res = await requestAppointmentNotificationPermission();
    setBrowserPermission(res.permission);
    setPrefs(loadReminderPreferences());

    if (res.permission === 'granted') {
      setStatusMessage(
        'Browser & service-worker appointment notifications are now active!'
      );
      await dispatchAppointmentNotification({
        id: `welcome-${Date.now()}`,
        title: `Appointment alerts enabled · ${CLINIC_CONFIG.shortName}`,
        body: `We will send you a friendly reminder before your dental visit so your family never misses a slot.`,
        service: 'Appointment Reminder Service',
        preferredDate: getTomorrowDateString(),
        preferredTimeSlot: 'morning',
      });
    } else {
      setStatusMessage(
        'Interval-based in-app appointment alerts are enabled! (OS popup notifications were restricted by your browser or preview frame, so alerts will appear right on screen.)'
      );
    }
    setTimeout(() => setStatusMessage(null), 6000);
  };

  const handleToggleMasterSwitch = () => {
    if (!prefs.enabled) {
      handleEnableNotifications();
    } else {
      const next = { ...prefs, enabled: false };
      saveReminderPreferences(next);
      setPrefs(next);
      setStatusMessage('Appointment reminder notifications paused.');
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleToggleTimingOption = (
    key: 'alert24HoursBefore' | 'alertMorningOfVisit' | 'alert2HoursBefore'
  ) => {
    const next = { ...prefs, [key]: !prefs[key] };
    saveReminderPreferences(next);
    setPrefs(next);
  };

  const handleSendTestAlert = async () => {
    if (!prefs.enabled) {
      await handleEnableNotifications();
    }
    const sample = reminders[0] || {
      id: `test-${Date.now()}`,
      patientName: 'Aarav & Family',
      service: 'Child dental check-ups',
      preferredDate: getTomorrowDateString(),
      preferredTimeSlot: 'morning' as const,
    };

    await dispatchAppointmentNotification({
      id: `test-${Date.now()}`,
      title: `Upcoming dental visit reminder · ${CLINIC_CONFIG.shortName}`,
      body: `Friendly reminder for ${sample.patientName}: ${sample.service} on ${sample.preferredDate} (${formatSlotLabel(sample.preferredTimeSlot)}). Tap to view or call ${CLINIC_CONFIG.phoneDisplay}.`,
      service: sample.service,
      preferredDate: sample.preferredDate,
      preferredTimeSlot: sample.preferredTimeSlot,
    });

    setStatusMessage('Test appointment reminder sent! Check your notification banner.');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleAddCustomReminder = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = patientName.trim().slice(0, 80) || 'Family Member';
    upsertAppointmentReminder({
      id: `manual_${Date.now()}`,
      patientName: cleanName,
      service,
      preferredDate,
      preferredTimeSlot,
      status: 'booked',
      createdAt: new Date().toISOString(),
    });
    setShowAddForm(false);
    if (!prefs.enabled) {
      handleEnableNotifications();
    } else {
      setStatusMessage('Appointment reminder scheduled!');
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleDeleteReminder = (id: string) => {
    removeAppointmentReminder(id);
  };

  return (
    <div
      id="appointment-reminders"
      className="bg-[#FFFFFF] rounded-2xl p-6 sm:p-8 border border-[#0E7C86]/25 space-y-6"
    >
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E6F4F1] pb-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="inline-flex items-center gap-2 caption-text font-bold text-[#0E7C86]">
            <BellRing className="w-4 h-4 text-[#0E7C86]" aria-hidden="true" />
            <span>No-show prevention · Service worker &amp; interval alerts</span>
          </div>
          <h3 className="text-[22px] font-extrabold text-[#0B2B3A]">
            Browser appointment reminders
          </h3>
          <p className="caption-text text-[#0B2B3A]">
            Enable gentle browser notifications so busy parents and families get timely alerts 24 hours before, on the morning of, and 2 hours before their dental check-up.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSendTestAlert}
            className="btn-teal-outline !min-h-[44px] !py-2 !px-4"
          >
            <Sparkles className="w-4 h-4 text-[#0E7C86]" aria-hidden="true" />
            <span>Send test alert</span>
          </button>

          <button
            type="button"
            onClick={handleToggleMasterSwitch}
            aria-pressed={prefs.enabled}
            className={`!min-h-[44px] !py-2.5 !px-5 ${
              prefs.enabled ? 'btn-teal' : 'btn-coral'
            }`}
          >
            <Bell
              className={`w-4 h-4 shrink-0 ${
                prefs.enabled ? 'text-[#FFFFFF]' : 'text-[#0B2B3A]'
              }`}
              aria-hidden="true"
            />
            <span>
              {prefs.enabled ? 'Notifications enabled' : 'Allow appointment notifications'}
            </span>
          </button>
        </div>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div
          role="status"
          aria-live="polite"
          className="bg-[#E6F4F1] border border-[#0E7C86] rounded-xl px-4 py-3 flex items-center gap-2.5"
        >
          <CheckCircle2 className="w-5 h-5 text-[#0E7C86] shrink-0" />
          <span className="caption-text font-bold text-[#0B2B3A]">{statusMessage}</span>
        </div>
      )}

      {/* Timing Checkboxes + Permission Badge */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 bg-[#E6F4F1]/60 rounded-2xl p-5 border border-[#0E7C86]/15 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-[17px] font-bold text-[#0B2B3A]">
              When should we remind you?
            </h4>
            <span className="caption-text font-bold text-[#0E7C86] bg-[#FFFFFF] px-2.5 py-0.5 rounded-lg border border-[#0E7C86]/20">
              {browserPermission === 'granted'
                ? 'OS + SW Active'
                : prefs.enabled
                ? 'Interval Active'
                : 'Paused'}
            </span>
          </div>

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={prefs.alert24HoursBefore}
                onChange={() => handleToggleTimingOption('alert24HoursBefore')}
                className="mt-1 w-4 h-4 accent-[#0E7C86] rounded shrink-0"
              />
              <div>
                <div className="caption-text font-bold text-[#0B2B3A]">
                  24 hours before appointment
                </div>
                <div className="text-xs text-[#0B2B3A]">
                  Day-before reminder to confirm transport or reschedule early if needed.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={prefs.alertMorningOfVisit}
                onChange={() => handleToggleTimingOption('alertMorningOfVisit')}
                className="mt-1 w-4 h-4 accent-[#0E7C86] rounded shrink-0"
              />
              <div>
                <div className="caption-text font-bold text-[#0B2B3A]">
                  Morning of the visit
                </div>
                <div className="text-xs text-[#0B2B3A]">
                  Helpful nudge to pack your child’s toothbrush and comfort toy.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={prefs.alert2HoursBefore}
                onChange={() => handleToggleTimingOption('alert2HoursBefore')}
                className="mt-1 w-4 h-4 accent-[#0E7C86] rounded shrink-0"
              />
              <div>
                <div className="caption-text font-bold text-[#0B2B3A]">
                  2 hours before time slot
                </div>
                <div className="text-xs text-[#0B2B3A]">
                  Final heads-up so you can give a light snack 45 minutes before arriving.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Scheduled Reminders List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-[17px] font-bold text-[#0B2B3A]">
              Scheduled visit alerts ({reminders.length})
            </h4>
            <button
              type="button"
              onClick={() => setShowAddForm((prev) => !prev)}
              className="caption-text font-bold text-[#0E7C86] hover:text-[#0B2B3A] inline-flex items-center gap-1"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>{showAddForm ? 'Close form' : 'Add custom visit reminder'}</span>
            </button>
          </div>

          {showAddForm && (
            <form
              onSubmit={handleAddCustomReminder}
              className="bg-[#E6F4F1] rounded-2xl p-4 sm:p-5 border border-[#0E7C86]/25 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="rem-patient"
                    className="block caption-text font-bold text-[#0B2B3A] mb-1"
                  >
                    Patient name
                  </label>
                  <input
                    id="rem-patient"
                    type="text"
                    required
                    maxLength={80}
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-1.5 rounded-xl border border-[#0B2B3A]/20 bg-[#FFFFFF] text-[15px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="rem-service"
                    className="block caption-text font-bold text-[#0B2B3A] mb-1"
                  >
                    Service
                  </label>
                  <select
                    id="rem-service"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-1.5 rounded-xl border border-[#0B2B3A]/20 bg-[#FFFFFF] text-[15px]"
                  >
                    {CLINIC_CONFIG.services.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                    <option value="General family check-up">General family check-up</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="rem-date"
                    className="block caption-text font-bold text-[#0B2B3A] mb-1"
                  >
                    Appointment date
                  </label>
                  <input
                    id="rem-date"
                    type="date"
                    required
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-1.5 rounded-xl border border-[#0B2B3A]/20 bg-[#FFFFFF] text-[15px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="rem-slot"
                    className="block caption-text font-bold text-[#0B2B3A] mb-1"
                  >
                    Time slot
                  </label>
                  <select
                    id="rem-slot"
                    value={preferredTimeSlot}
                    onChange={(e) =>
                      setPreferredTimeSlot(
                        e.target.value as 'morning' | 'afternoon' | 'evening'
                      )
                    }
                    className="w-full min-h-[42px] px-3 py-1.5 rounded-xl border border-[#0B2B3A]/20 bg-[#FFFFFF] text-[15px]"
                  >
                    <option value="morning">Morning (9:30 am – 1:00 pm)</option>
                    <option value="afternoon">Afternoon (1:00 pm – 4:30 pm)</option>
                    <option value="evening">Evening (4:30 pm – 8:00 pm)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="btn-coral !min-h-[40px] !py-2 !px-4"
                >
                  Save alert
                </button>
              </div>
            </form>
          )}

          {reminders.length === 0 ? (
            <div className="bg-[#E6F4F1]/50 rounded-2xl p-5 border border-[#0E7C86]/15 text-center space-y-2">
              <p className="caption-text text-[#0B2B3A]">
                When you book an appointment below or sign in to your Patient Portal, your upcoming visits automatically appear here for browser reminder alerts.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {reminders.map((rem) => (
                <div
                  key={rem.id}
                  className="bg-[#E6F4F1]/60 rounded-xl p-4 border border-[#0E7C86]/20 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="text-[16px] font-bold text-[#0B2B3A]">
                      {rem.service} — {rem.patientName}
                    </div>
                    <div className="caption-text text-[#0B2B3A] inline-flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-semibold text-[#0E7C86]">
                        <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                        {rem.preferredDate}
                      </span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#0E7C86]" aria-hidden="true" />
                        {formatSlotLabel(rem.preferredTimeSlot)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteReminder(rem.id)}
                    aria-label={`Remove reminder for ${rem.service}`}
                    className="min-w-[38px] min-h-[38px] rounded-xl border border-[#0B2B3A]/15 bg-[#FFFFFF] inline-flex items-center justify-center text-[#0B2B3A] hover:bg-[#E6F4F1]"
                  >
                    <Trash2 className="w-4 h-4 text-[#0E7C86]" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Global background interval checker + non-intrusive opt-in banner + live notification toast
 */
export const AppointmentReminderGlobalWatcher: React.FC<{
  onNavigateToPortal: () => void;
}> = ({ onNavigateToPortal }) => {
  const [prefs, setPrefs] = useState<ReminderPreferences>(() =>
    loadReminderPreferences()
  );
  const [reminders, setReminders] = useState<ScheduledAppointmentReminder[]>(() =>
    loadScheduledReminders()
  );
  const [activeAlert, setActiveAlert] = useState<ActiveInAppAlert | null>(null);

  useEffect(() => {
    registerAppointmentServiceWorker();

    // Run immediate check and then every 30 seconds
    evaluateDueAppointmentReminders();
    const interval = window.setInterval(() => {
      evaluateDueAppointmentReminders();
    }, 30000);

    const unsubUpdates = subscribeToReminderUpdates(() => {
      setPrefs(loadReminderPreferences());
      setReminders(loadScheduledReminders());
    });

    const unsubAlerts = subscribeToInAppAlerts((alert) => {
      setActiveAlert(alert);
    });

    // Listen to Service Worker notification clicks
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
        onNavigateToPortal();
      }
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    return () => {
      window.clearInterval(interval);
      unsubUpdates();
      unsubAlerts();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, [onNavigateToPortal]);

  const handleAcceptPromptBanner = async () => {
    await requestAppointmentNotificationPermission();
    setPrefs(loadReminderPreferences());
    evaluateDueAppointmentReminders();
  };

  const handleDismissPromptBanner = () => {
    const next = { ...prefs, promptDismissed: true };
    saveReminderPreferences(next);
    setPrefs(next);
  };

  const showOptInBanner =
    reminders.length > 0 && !prefs.enabled && !prefs.promptDismissed;

  return (
    <>
      {/* 1. Non-intrusive Opt-In Prompt when an appointment exists but notifications aren't enabled yet */}
      {showOptInBanner && (
        <div
          role="region"
          aria-label="Enable appointment reminder notifications"
          className="fixed bottom-20 md:bottom-6 left-4 z-40 max-w-md bg-[#FFFFFF] rounded-2xl p-4 sm:p-5 border-2 border-[#0E7C86] shadow-xl space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E6F4F1] text-[#0E7C86] flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-[17px] font-extrabold text-[#0B2B3A]">
                  Get a reminder before your dental visit?
                </h3>
                <p className="caption-text text-[#0B2B3A] mt-0.5">
                  Allow browser notifications so we can send a helpful heads-up before your upcoming slot.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDismissPromptBanner}
              aria-label="Dismiss notification prompt"
              className="min-w-[36px] min-h-[36px] rounded-lg inline-flex items-center justify-center text-[#0B2B3A] hover:bg-[#E6F4F1]"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleDismissPromptBanner}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl caption-text font-bold text-[#0B2B3A] hover:bg-[#E6F4F1]"
            >
              Not now
            </button>
            <button
              type="button"
              onClick={handleAcceptPromptBanner}
              className="btn-coral !min-h-[40px] !py-2 !px-4"
            >
              <Bell className="w-4 h-4 text-[#0B2B3A]" aria-hidden="true" />
              <span>Allow notifications</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Live Appointment Reminder Alert Toast (Triggered by Interval or Test Button) */}
      {activeAlert && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed top-24 right-4 z-50 max-w-md w-[calc(100%-2rem)] bg-[#FFFFFF] rounded-2xl p-5 border-2 border-[#0E7C86] shadow-2xl space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0E7C86] text-[#FFFFFF] flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <div className="caption-text font-extrabold text-[#0E7C86]">
                  Appointment reminder alert
                </div>
                <h4 className="text-[18px] font-extrabold text-[#0B2B3A]">
                  {activeAlert.title}
                </h4>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveAlert(null)}
              aria-label="Close reminder alert"
              className="min-w-[36px] min-h-[36px] rounded-lg inline-flex items-center justify-center text-[#0B2B3A] hover:bg-[#E6F4F1]"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <p className="caption-text text-[#0B2B3A] leading-relaxed">
            {activeAlert.body}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E6F4F1]">
            <a
              href={`tel:${CLINIC_CONFIG.phoneTel}`}
              className="inline-flex items-center gap-1.5 caption-text font-extrabold text-[#0E7C86] underline"
            >
              <Phone className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Call {CLINIC_CONFIG.phoneDisplay}</span>
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveAlert(null);
                  onNavigateToPortal();
                }}
                className="btn-teal !min-h-[38px] !py-1.5 !px-3.5 !text-sm"
              >
                View details
              </button>
              <button
                type="button"
                onClick={() => setActiveAlert(null)}
                className="btn-coral !min-h-[38px] !py-1.5 !px-3.5 !text-sm"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
