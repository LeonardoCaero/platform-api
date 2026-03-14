export interface PushPayload {
  title: string;
  body?: string;
  url?: string;
}

function fmt(date: Date, lang: string): string {
  const locale = lang === 'es' ? 'es-ES' : 'en-GB';
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

const messages = {
  en: {
    calendarNoteCreated: (title: string, date: Date): PushPayload => ({
      title: 'New calendar note',
      body: `${title} — ${fmt(date, 'en')}`,
      url: '/calendar',
    }),
    calendarNoteUpdated: (title: string, date: Date): PushPayload => ({
      title: 'Calendar note updated',
      body: `${title} — ${fmt(date, 'en')}`,
      url: '/calendar',
    }),
    companyRequestApproved: (name: string): PushPayload => ({
      title: 'Company request approved',
      body: `Your request for "${name}" has been approved.`,
      url: '/my-requests',
    }),
    companyRequestRejected: (name: string): PushPayload => ({
      title: 'Company request rejected',
      body: `Your request for "${name}" has been rejected.`,
      url: '/my-requests',
    }),
    permissionRequestApproved: (key: string): PushPayload => ({
      title: 'Permission request approved',
      body: `Your request for "${key}" has been approved.`,
      url: '/my-permission-requests',
    }),
    permissionRequestRejected: (key: string): PushPayload => ({
      title: 'Permission request rejected',
      body: `Your request for "${key}" has been rejected.`,
      url: '/my-permission-requests',
    }),
    memberInvited: (companyName: string): PushPayload => ({
      title: 'Company invitation',
      body: `You have been invited to join "${companyName}".`,
      url: '/dashboard',
    }),
    hoursLogged: (hours: string, title: string, date: Date): PushPayload => ({
      title: 'Hours logged on your behalf',
      body: `${hours}h logged for "${title}" on ${fmt(date, 'en')}.`,
      url: '/time-tracker',
    }),
  },
  es: {
    calendarNoteCreated: (title: string, date: Date): PushPayload => ({
      title: 'Nueva nota en el calendario',
      body: `${title} — ${fmt(date, 'es')}`,
      url: '/calendar',
    }),
    calendarNoteUpdated: (title: string, date: Date): PushPayload => ({
      title: 'Nota de calendario actualizada',
      body: `${title} — ${fmt(date, 'es')}`,
      url: '/calendar',
    }),
    companyRequestApproved: (name: string): PushPayload => ({
      title: 'Solicitud de empresa aprobada',
      body: `Tu solicitud para "${name}" ha sido aprobada.`,
      url: '/my-requests',
    }),
    companyRequestRejected: (name: string): PushPayload => ({
      title: 'Solicitud de empresa rechazada',
      body: `Tu solicitud para "${name}" ha sido rechazada.`,
      url: '/my-requests',
    }),
    permissionRequestApproved: (key: string): PushPayload => ({
      title: 'Solicitud de permiso aprobada',
      body: `Tu solicitud para "${key}" ha sido aprobada.`,
      url: '/my-permission-requests',
    }),
    permissionRequestRejected: (key: string): PushPayload => ({
      title: 'Solicitud de permiso rechazada',
      body: `Tu solicitud para "${key}" ha sido rechazada.`,
      url: '/my-permission-requests',
    }),
    memberInvited: (companyName: string): PushPayload => ({
      title: 'Invitación a empresa',
      body: `Has sido invitado a unirte a "${companyName}".`,
      url: '/dashboard',
    }),
    hoursLogged: (hours: string, title: string, date: Date): PushPayload => ({
      title: 'Horas registradas en tu nombre',
      body: `${hours}h registradas para "${title}" el ${fmt(date, 'es')}.`,
      url: '/time-tracker',
    }),
  },
};

type Lang = keyof typeof messages;

export function t(lang: string | null | undefined): typeof messages.en {
  const l = (lang ?? 'en') as Lang;
  return messages[l] ?? messages.en;
}
