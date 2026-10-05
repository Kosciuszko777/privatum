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

// ─── Vault demo data ─────────────────────────────────────────────────

export interface DemoVaultFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  documentCount: number;
  totalSize: number;
  lastActivity: string;
}

export interface DemoVaultDocument {
  id: string;
  folderId: string;
  filename: string;
  mimeType: string;
  size: number;
  status: 'active' | 'pending-deletion';
  source: 'inbox' | 'upload' | 'secure-link';
  senderName?: string;
  createdAt: string;
  deleteAt?: string;
  retention: string;
}

export interface DemoAccessGrant {
  id: string;
  grantedName: string;
  targetName: string;
  permissions: string[];
  createdAt: string;
  expiresAt?: string;
  status: 'active' | 'expired' | 'revoked';
}

export const demoVaultFolders: DemoVaultFolder[] = [
  {
    id: 'vf-001',
    name: 'Nachlasssache Müller',
    description: 'Erbschaftsangelegenheiten Familie Müller, Zollikon',
    color: '#6E1F2E',
    documentCount: 5,
    totalSize: 12800000,
    lastActivity: '15. Juli 2026',
  },
  {
    id: 'vf-002',
    name: 'Alpine Ventures AG',
    description: 'Due Diligence und Gesellschaftsrecht',
    color: '#3A6B5E',
    documentCount: 3,
    totalSize: 4200000,
    lastActivity: '14. Juli 2026',
  },
  {
    id: 'vf-003',
    name: 'Private Client 2026',
    description: 'Steuer- und Vermögensplanung',
    color: '#B08D45',
    documentCount: 4,
    totalSize: 9800000,
    lastActivity: '12. Juli 2026',
  },
];

export const demoVaultDocuments: DemoVaultDocument[] = [
  {
    id: 'vd-001',
    folderId: 'vf-001',
    filename: 'Passport_Mueller.pdf',
    mimeType: 'application/pdf',
    size: 2400000,
    status: 'active',
    source: 'inbox',
    senderName: 'Thomas Müller',
    createdAt: '15. Juli 2026',
    deleteAt: '15. August 2026',
    retention: '30d',
  },
  {
    id: 'vd-002',
    folderId: 'vf-001',
    filename: 'Grundbuchauszug_Zollikon.pdf',
    mimeType: 'application/pdf',
    size: 890000,
    status: 'active',
    source: 'inbox',
    senderName: 'Thomas Müller',
    createdAt: '15. Juli 2026',
    retention: 'manual',
  },
  {
    id: 'vd-003',
    folderId: 'vf-001',
    filename: 'Bankauszüge_Q1-Q4.zip',
    mimeType: 'application/zip',
    size: 5200000,
    status: 'active',
    source: 'inbox',
    senderName: 'Thomas Müller',
    createdAt: '15. Juli 2026',
    deleteAt: '15. August 2026',
    retention: '30d',
  },
  {
    id: 'vd-004',
    folderId: 'vf-001',
    filename: 'Testament_Entwurf_v2.pdf',
    mimeType: 'application/pdf',
    size: 340000,
    status: 'active',
    source: 'upload',
    createdAt: '10. Juli 2026',
    retention: 'manual',
  },
  {
    id: 'vd-005',
    folderId: 'vf-001',
    filename: 'Liegenschaftsbewertung.pdf',
    mimeType: 'application/pdf',
    size: 3970000,
    status: 'pending-deletion',
    source: 'inbox',
    senderName: 'Immobilien Schweiz AG',
    createdAt: '5. Juli 2026',
    deleteAt: '20. Juli 2026',
    retention: '30d',
  },
  {
    id: 'vd-006',
    folderId: 'vf-002',
    filename: 'Shareholders_Agreement_v3.pdf',
    mimeType: 'application/pdf',
    size: 1800000,
    status: 'active',
    source: 'secure-link',
    senderName: 'Alpine Ventures AG',
    createdAt: '14. Juli 2026',
    retention: 'manual',
  },
  {
    id: 'vd-007',
    folderId: 'vf-002',
    filename: 'Due_Diligence_Report.pdf',
    mimeType: 'application/pdf',
    size: 1200000,
    status: 'active',
    source: 'upload',
    createdAt: '12. Juli 2026',
    retention: 'manual',
  },
  {
    id: 'vd-008',
    folderId: 'vf-002',
    filename: 'Handelsregisterauszug.pdf',
    mimeType: 'application/pdf',
    size: 1200000,
    status: 'active',
    source: 'inbox',
    senderName: 'Alpine Ventures AG',
    createdAt: '8. Juli 2026',
    retention: 'manual',
  },
  {
    id: 'vd-009',
    folderId: 'vf-003',
    filename: 'Steuerdokumente_2025.zip',
    mimeType: 'application/zip',
    size: 8900000,
    status: 'active',
    source: 'inbox',
    senderName: 'Karin Bachmann',
    createdAt: '12. Juli 2026',
    deleteAt: '12. August 2026',
    retention: '30d',
  },
  {
    id: 'vd-010',
    folderId: 'vf-003',
    filename: 'Medical_Report.pdf',
    mimeType: 'application/pdf',
    size: 450000,
    status: 'active',
    source: 'inbox',
    senderName: 'Karin Bachmann',
    createdAt: '12. Juli 2026',
    retention: 'manual',
  },
];

// ─── Directory demo data (Phase V) ───────────────────────────────────

export interface DirectoryProfessional {
  /** NIP-05 identifier used to resolve + message them. */
  nip05: string;
  name: string;
  title: string;
  jurisdiction: string;
  vertical: 'lawyers' | 'healthcare' | 'psychotherapy' | 'fiduciary' | 'notaries' | 'wealth';
  verified: 'self-declared' | 'domain-verified' | 'register-verified';
  verificationSource?: string;
}

/**
 * A curated set of register-verified professionals shown in the public
 * directory. These are illustrative Swiss personas; resolving them performs
 * a real NIP-05 lookup against the listed domain.
 */
export const demoDirectory: DirectoryProfessional[] = [
  {
    nip05: 'anna@meier-law.ch',
    name: 'Dr. Anna Meier',
    title: 'Rechtsanwältin / Attorney at Law',
    jurisdiction: 'Zürich, Schweiz',
    vertical: 'lawyers',
    verified: 'register-verified',
    verificationSource: 'Zürcher Anwaltsverband',
  },
  {
    nip05: 'laura@praxis-furrer.ch',
    name: 'Dr. med. Laura Furrer',
    title: 'Fachärztin für Psychiatrie und Psychotherapie',
    jurisdiction: 'Bern, Schweiz',
    vertical: 'psychotherapy',
    verified: 'domain-verified',
    verificationSource: 'praxis-furrer.ch',
  },
  {
    nip05: 'info@treuhand-gasser.ch',
    name: 'Treuhand Gasser',
    title: 'Fiduciaria / Treuhandgesellschaft',
    jurisdiction: 'Lugano, Svizzera',
    vertical: 'fiduciary',
    verified: 'self-declared',
  },
  {
    nip05: 'weber@weber-partner.ch',
    name: 'RA Lukas Weber',
    title: 'Rechtsanwalt, Kanzlei Weber & Partner',
    jurisdiction: 'Basel, Schweiz',
    vertical: 'lawyers',
    verified: 'register-verified',
    verificationSource: 'Advokatenkammer Basel',
  },
  {
    nip05: 'notariat@brunner-notare.ch',
    name: 'Notariat Brunner',
    title: 'Notar / Beurkundungen',
    jurisdiction: 'Luzern, Schweiz',
    vertical: 'notaries',
    verified: 'register-verified',
    verificationSource: 'Notariatsinspektorat Luzern',
  },
  {
    nip05: 'kontakt@alpenwealth.ch',
    name: 'AlpenWealth AG',
    title: 'Vermögensverwaltung / Wealth Management',
    jurisdiction: 'Zug, Schweiz',
    vertical: 'wealth',
    verified: 'domain-verified',
    verificationSource: 'alpenwealth.ch',
  },
];

export const demoAccessGrants: DemoAccessGrant[] = [
  {
    id: 'ag-001',
    grantedName: 'RA Lukas Weber (Kanzlei Weber & Partner)',
    targetName: 'Nachlasssache Müller',
    permissions: ['view', 'download'],
    createdAt: '12. Juli 2026',
    expiresAt: '31. Dezember 2026',
    status: 'active',
  },
  {
    id: 'ag-002',
    grantedName: 'Treuhand Gasser',
    targetName: 'Private Client 2026 — Steuerdokumente_2025.zip',
    permissions: ['view', 'download', 'forward'],
    createdAt: '13. Juli 2026',
    expiresAt: '30. September 2026',
    status: 'active',
  },
  {
    id: 'ag-003',
    grantedName: 'Alpine Ventures AG (Sekretariat)',
    targetName: 'Due_Diligence_Report.pdf',
    permissions: ['view'],
    createdAt: '10. Juli 2026',
    expiresAt: '10. Juli 2026',
    status: 'expired',
  },
];
