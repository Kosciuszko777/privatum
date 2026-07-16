/**
 * Demo data — never lorem ipsum in product areas.
 * §12: Real professional personas with realistic Swiss context.
 */

export interface DemoDelivery {
  id: string;
  senderName: string;
  senderEmail?: string;
  date: string;
  timestamp: number;
  fileCount: number;
  files: { name: string; size: number }[];
  message?: string;
  status: 'new' | 'viewed' | 'downloaded' | 'archived';
  channelId: string;
  securityStatus: 'verified' | 'pending';
  expiresAt?: string;
}

export interface DemoSecureLink {
  id: string;
  token: string;
  recipientName?: string;
  purpose: string;
  created: string;
  expires: string;
  maxUploads: number;
  currentUploads: number;
  accessCodeEnabled: boolean;
  status: 'active' | 'expired' | 'used';
  oneTimeUse: boolean;
}

export interface DemoActivity {
  id: string;
  type: 'delivery' | 'link_opened' | 'download' | 'link_created' | 'expired' | 'access';
  description: string;
  timestamp: string;
  relativeTime: string;
}

// Dr. Anna Meier — Attorney at Law, Zurich
export const annaMeier = {
  handle: 'anna-meier',
  name: 'Dr. Anna Meier',
  title: 'Rechtsanwältin / Attorney at Law',
  jurisdiction: 'Zürich, Schweiz',
  verified: 'register-verified' as const,
  verificationSource: 'Zürcher Anwaltsverband',
  verificationDate: '2026-01-15',
};

// Dr. med. Laura Furrer — Bern
export const lauraFurrer = {
  handle: 'laura-furrer',
  name: 'Dr. med. Laura Furrer',
  title: 'Fachärztin für Psychiatrie und Psychotherapie',
  jurisdiction: 'Bern, Schweiz',
  verified: 'domain-verified' as const,
  verificationSource: 'praxis-furrer.ch',
  verificationDate: '2026-02-20',
};

// Treuhand Gasser — Lugano
export const treuhandGasser = {
  handle: 'treuhand-gasser',
  name: 'Treuhand Gasser',
  title: 'Fiduciaria / Treuhandgesellschaft',
  jurisdiction: 'Lugano, Svizzera',
  verified: 'self-declared' as const,
};

export const demoDeliveries: DemoDelivery[] = [
  {
    id: 'del-001',
    senderName: 'Thomas Müller',
    senderEmail: 't.mueller@example.ch',
    date: '15. Juli 2026',
    timestamp: 1752577200,
    fileCount: 3,
    files: [
      { name: 'Passport_Mueller.pdf', size: 2400000 },
      { name: 'Grundbuchauszug_Zollikon.pdf', size: 890000 },
      { name: 'Bankauszüge_Q1-Q4.zip', size: 5200000 },
    ],
    message: 'Sehr geehrte Frau Meier, anbei die angeforderten Dokumente für die Nachlasssache.',
    status: 'new',
    channelId: 'ch-anna-meier-01',
    securityStatus: 'verified',
    expiresAt: '22. Juli 2026',
  },
  {
    id: 'del-002',
    senderName: 'Alpine Ventures AG',
    date: '14. Juli 2026',
    timestamp: 1752490800,
    fileCount: 1,
    files: [
      { name: 'Shareholders_Agreement_v3.pdf', size: 1800000 },
    ],
    status: 'viewed',
    channelId: 'ch-anna-meier-02',
    securityStatus: 'verified',
  },
  {
    id: 'del-003',
    senderName: 'Karin Bachmann',
    senderEmail: 'k.bachmann@example.ch',
    date: '12. Juli 2026',
    timestamp: 1752318000,
    fileCount: 2,
    files: [
      { name: 'Steuerdokumente_2025.zip', size: 8900000 },
      { name: 'Medical_Report.pdf', size: 450000 },
    ],
    message: 'Die angeforderten Steuerunterlagen und der ärztliche Bericht.',
    status: 'downloaded',
    channelId: 'ch-anna-meier-03',
    securityStatus: 'verified',
    expiresAt: '12. August 2026',
  },
];

export const demoSecureLinks: DemoSecureLink[] = [
  {
    id: 'sl-001',
    token: 'xK9mP2vQ',
    recipientName: 'Thomas Müller',
    purpose: 'Nachlasssache Müller — Dokumenteneingang',
    created: '10. Juli 2026',
    expires: '31. Juli 2026',
    maxUploads: 10,
    currentUploads: 3,
    accessCodeEnabled: true,
    status: 'active',
    oneTimeUse: false,
  },
  {
    id: 'sl-002',
    token: 'aB3nR7wE',
    recipientName: 'Alpine Ventures AG',
    purpose: 'Due Diligence Unterlagen',
    created: '8. Juli 2026',
    expires: '8. August 2026',
    maxUploads: 20,
    currentUploads: 1,
    accessCodeEnabled: true,
    status: 'active',
    oneTimeUse: false,
  },
  {
    id: 'sl-003',
    token: 'zF5kL1yH',
    purpose: 'Private Client 2026 — Erstberatung',
    created: '1. Juli 2026',
    expires: '15. Juli 2026',
    maxUploads: 5,
    currentUploads: 5,
    accessCodeEnabled: true,
    status: 'used',
    oneTimeUse: false,
  },
];

export const demoActivities: DemoActivity[] = [
  {
    id: 'act-001',
    type: 'delivery',
    description: 'Thomas Müller hat 3 Dokumente gesendet',
    timestamp: '15.07.2026, 09:14',
    relativeTime: 'Gerade eben',
  },
  {
    id: 'act-002',
    type: 'link_opened',
    description: 'Sicherer Link #sl-002 wurde geöffnet',
    timestamp: '14.07.2026, 16:42',
    relativeTime: 'Gestern',
  },
  {
    id: 'act-003',
    type: 'download',
    description: 'Shareholders_Agreement_v3.pdf heruntergeladen',
    timestamp: '14.07.2026, 14:30',
    relativeTime: 'Gestern',
  },
  {
    id: 'act-004',
    type: 'expired',
    description: 'Sicherer Link für Private Client 2026 abgelaufen',
    timestamp: '15.07.2026, 00:00',
    relativeTime: 'Heute',
  },
  {
    id: 'act-005',
    type: 'access',
    description: 'Zugangscode für Nachlasssache Müller verifiziert',
    timestamp: '15.07.2026, 08:55',
    relativeTime: 'Gerade eben',
  },
];

/**
 * Summary stats for the dashboard.
 */
export const dashboardStats = {
  newDeliveries: 1,
  activeLinks: 2,
  storageUsed: '18.4 GB',
  storageTotal: '20 GB',
  storagePercent: 92,
  securityScore: 3, // out of 5 checklist items
};
