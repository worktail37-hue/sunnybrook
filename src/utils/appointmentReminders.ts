import { CLINIC_CONFIG } from '../config/clinicConfig';

export interface ScheduledAppointmentReminder {
  id: string;
  patientName: string;
  service: string;
  preferredDate: string; // YYYY-MM-DD
  preferredTimeSlot: 'morning' | 'afternoon' | 'evening';
  status: 'new' | 'contacted' | 'booked' | 'closed';
  notified24h?: boolean;
  notified2h?: boolean;
  notifiedSameDay?: boolean;
  createdAt: string;
}

export interface ReminderPreferences {
  enabled: boolean;
  alert24HoursBefore: boolean;
  alertMorningOfVisit: boolean;
  alert2HoursBefore: boolean;
  promptDismissed: boolean;
}

export interface ActiveInAppAlert {
  id: string;
  title: string;
  body: string;
  service: string;
  preferredDate: string;
  preferredTimeSlot: string;
  triggeredAt: string;
}

const REMINDERS_STORAGE_KEY = 'sunnybrook_scheduled_reminders_v1';
const PREFS_STORAGE_KEY = 'sunnybrook_reminder_prefs_v1';
const REMINDER_EVENT_NAME = 'sunnybrook-reminders-updated';
const IN_APP_ALERT_EVENT_NAME = 'sunnybrook-in-app-alert';

export function getDefaultPreferences(): ReminderPreferences {
  return {
    enabled: false,
    alert24HoursBefore: true,
    alertMorningOfVisit: true,
    alert2HoursBefore: true,
    promptDismissed: false,
  };
}

export function loadReminderPreferences(): ReminderPreferences {
  try {
    const raw = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (raw) {
      return { ...getDefaultPreferences(), ...JSON.parse(raw) };
    }
  } catch {
    // Ignore storage read errors
  }
  return getDefaultPreferences();
}

export function saveReminderPreferences(prefs: ReminderPreferences): void {
  try {
    window.localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent(REMINDER_EVENT_NAME));
  } catch {
    // Ignore storage write errors
  }
}

export function loadScheduledReminders(): ScheduledAppointmentReminder[] {
  try {
    const raw = window.localStorage.getItem(REMINDERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore storage read errors
  }
  return [];
}

export function saveScheduledReminders(reminders: ScheduledAppointmentReminder[]): void {
  try {
    window.localStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
    window.dispatchEvent(new CustomEvent(REMINDER_EVENT_NAME));
  } catch {
    // Ignore storage write errors
  }
}

export function upsertAppointmentReminder(
  input: Omit<
    ScheduledAppointmentReminder,
    'notified24h' | 'notified2h' | 'notifiedSameDay'
  >
): ScheduledAppointmentReminder[] {
  const existing = loadScheduledReminders();
  const idx = existing.findIndex(
    (r) =>
      r.id === input.id ||
      (r.preferredDate === input.preferredDate &&
        r.preferredTimeSlot === input.preferredTimeSlot &&
        r.service === input.service)
  );

  let next: ScheduledAppointmentReminder[];
  if (idx >= 0) {
    next = existing.map((item, i) =>
      i === idx
        ? {
            ...item,
            patientName: input.patientName,
            service: input.service,
            preferredDate: input.preferredDate,
            preferredTimeSlot: input.preferredTimeSlot,
            status: input.status,
          }
        : item
    );
  } else {
    next = [
      {
        ...input,
        notified24h: false,
        notified2h: false,
        notifiedSameDay: false,
      },
      ...existing,
    ].slice(0, 20);
  }

  saveScheduledReminders(next);
  return next;
}

export function removeAppointmentReminder(id: string): ScheduledAppointmentReminder[] {
  const next = loadScheduledReminders().filter((r) => r.id !== id);
  saveScheduledReminders(next);
  return next;
}

export async function registerAppointmentServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register(
      '/appointment-reminder-sw.js',
      { scope: '/' }
    );
    return registration;
  } catch {
    return null;
  }
}

export function getBrowserNotificationPermission():
  | NotificationPermission
  | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestAppointmentNotificationPermission(): Promise<{
  granted: boolean;
  permission: NotificationPermission | 'unsupported';
  usedFallbackMode: boolean;
}> {
  await registerAppointmentServiceWorker();

  if (typeof window === 'undefined' || !('Notification' in window)) {
    const prefs = loadReminderPreferences();
    saveReminderPreferences({ ...prefs, enabled: true, promptDismissed: false });
    return {
      granted: true,
      permission: 'unsupported',
      usedFallbackMode: true,
    };
  }

  try {
    const result = await Notification.requestPermission();
    const prefs = loadReminderPreferences();
    if (result === 'granted') {
      saveReminderPreferences({ ...prefs, enabled: true, promptDismissed: false });
      return { granted: true, permission: result, usedFallbackMode: false };
    }
    // Even if blocked by browser iframe policy, enable in-app interval reminders so the user still gets on-screen alerts
    saveReminderPreferences({ ...prefs, enabled: true, promptDismissed: false });
    return {
      granted: true,
      permission: result,
      usedFallbackMode: true,
    };
  } catch {
    const prefs = loadReminderPreferences();
    saveReminderPreferences({ ...prefs, enabled: true, promptDismissed: false });
    return {
      granted: true,
      permission: getBrowserNotificationPermission(),
      usedFallbackMode: true,
    };
  }
}

export function formatSlotStartTime(
  dateStr: string,
  slot: 'morning' | 'afternoon' | 'evening'
): Date {
  const hourMap: Record<'morning' | 'afternoon' | 'evening', string> = {
    morning: '09:30:00',
    afternoon: '13:00:00',
    evening: '16:30:00',
  };
  const timePart = hourMap[slot] || '09:30:00';
  return new Date(`${dateStr}T${timePart}`);
}

export function formatSlotLabel(slot: 'morning' | 'afternoon' | 'evening' | string): string {
  if (slot === 'morning') return 'Morning (9:30 am – 1:00 pm)';
  if (slot === 'afternoon') return 'Afternoon (1:00 pm – 4:30 pm)';
  if (slot === 'evening') return 'Evening (4:30 pm – 8:00 pm)';
  return slot;
}

export async function dispatchAppointmentNotification(payload: {
  id: string;
  title: string;
  body: string;
  service: string;
  preferredDate: string;
  preferredTimeSlot: string;
}): Promise<void> {
  // 1. Always emit the in-app alert event so the user sees a calm banner on-screen
  const inAppAlert: ActiveInAppAlert = {
    id: payload.id,
    title: payload.title,
    body: payload.body,
    service: payload.service,
    preferredDate: payload.preferredDate,
    preferredTimeSlot: payload.preferredTimeSlot,
    triggeredAt: new Date().toISOString(),
  };
  window.dispatchEvent(
    new CustomEvent<ActiveInAppAlert>(IN_APP_ALERT_EVENT_NAME, {
      detail: inAppAlert,
    })
  );

  // 2. Also dispatch via Service Worker or native Notification API if permission is granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration('/');
        if (reg && reg.active) {
          reg.active.postMessage({
            type: 'SHOW_APPOINTMENT_REMINDER',
            title: payload.title,
            body: payload.body,
            tag: `sunnybrook-appt-${payload.id}`,
            appointmentId: payload.id,
            url: '/#patient-portal',
          });
          return;
        }
        if (reg && 'showNotification' in reg) {
          await reg.showNotification(payload.title, {
            body: payload.body,
            tag: `sunnybrook-appt-${payload.id}`,
          });
          return;
        }
      }
      new Notification(payload.title, {
        body: payload.body,
        tag: `sunnybrook-appt-${payload.id}`,
      });
    } catch {
      // In-app alert already displayed above
    }
  }
}

/**
 * Interval-based check that evaluates all upcoming scheduled reminders and triggers
 * 24-hour, morning-of-visit, or 2-hour alerts so families don't miss their visit.
 */
export async function evaluateDueAppointmentReminders(): Promise<void> {
  const prefs = loadReminderPreferences();
  if (!prefs.enabled) return;

  const reminders = loadScheduledReminders();
  if (reminders.length === 0) return;

  const now = new Date();
  let updated = false;

  const nextReminders = [...reminders];

  for (let i = 0; i < nextReminders.length; i++) {
    const r = nextReminders[i];
    if (r.status === 'closed') continue;

    const targetDate = formatSlotStartTime(r.preferredDate, r.preferredTimeSlot);
    if (Number.isNaN(targetDate.getTime())) continue;

    const hoursUntil = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Trigger 2-hour reminder window (between 0 and 2.5 hours before slot)
    if (
      prefs.alert2HoursBefore &&
      !r.notified2h &&
      hoursUntil > -1 &&
      hoursUntil <= 2.5
    ) {
      await dispatchAppointmentNotification({
        id: `${r.id}-2h`,
        title: `Upcoming dental visit today (${formatSlotLabel(r.preferredTimeSlot)})`,
        body: `Friendly reminder for ${r.patientName}: ${r.service} at ${CLINIC_CONFIG.clinicName}. Need to reschedule? Call ${CLINIC_CONFIG.phoneDisplay}.`,
        service: r.service,
        preferredDate: r.preferredDate,
        preferredTimeSlot: r.preferredTimeSlot,
      });
      nextReminders[i] = { ...r, notified2h: true, notifiedSameDay: true };
      updated = true;
      continue;
    }

    // Trigger Morning-of-visit / Same-day reminder (between 2.5 and 14 hours before slot)
    if (
      prefs.alertMorningOfVisit &&
      !r.notifiedSameDay &&
      hoursUntil > 2.5 &&
      hoursUntil <= 14
    ) {
      await dispatchAppointmentNotification({
        id: `${r.id}-sameday`,
        title: `Reminder: Dental visit today for ${r.patientName}`,
        body: `Your ${r.service} visit is scheduled for today (${r.preferredDate}, ${r.preferredTimeSlot}). We look forward to welcoming you!`,
        service: r.service,
        preferredDate: r.preferredDate,
        preferredTimeSlot: r.preferredTimeSlot,
      });
      nextReminders[i] = { ...r, notifiedSameDay: true };
      updated = true;
      continue;
    }

    // Trigger 24-hour advance reminder (between 14 and 30 hours before slot)
    if (
      prefs.alert24HoursBefore &&
      !r.notified24h &&
      hoursUntil > 14 &&
      hoursUntil <= 30
    ) {
      await dispatchAppointmentNotification({
        id: `${r.id}-24h`,
        title: `Tomorrow’s dental check-up reminder`,
        body: `Hi ${r.patientName}, your ${r.service} visit is tomorrow (${r.preferredDate}, ${r.preferredTimeSlot}) at ${CLINIC_CONFIG.shortName}.`,
        service: r.service,
        preferredDate: r.preferredDate,
        preferredTimeSlot: r.preferredTimeSlot,
      });
      nextReminders[i] = { ...r, notified24h: true };
      updated = true;
    }
  }

  if (updated) {
    saveScheduledReminders(nextReminders);
  }
}

export function subscribeToReminderUpdates(callback: () => void): () => void {
  window.addEventListener(REMINDER_EVENT_NAME, callback);
  return () => window.removeEventListener(REMINDER_EVENT_NAME, callback);
}

export function subscribeToInAppAlerts(
  callback: (alert: ActiveInAppAlert) => void
): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<ActiveInAppAlert>;
    if (customEvent.detail) {
      callback(customEvent.detail);
    }
  };
  window.addEventListener(IN_APP_ALERT_EVENT_NAME, handler);
  return () => window.removeEventListener(IN_APP_ALERT_EVENT_NAME, handler);
}
