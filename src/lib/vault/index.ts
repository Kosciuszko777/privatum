/**
 * VAULT — Zero-knowledge encrypted document storage.
 *
 * §5: Encrypted storage for what must be kept:
 * matters, cases, patients, folders.
 *
 * Client-side encryption throughout.
 * Vault metadata is stored in localStorage (encrypted references only).
 * Actual file blobs go through the StorageDriver abstraction.
 */

/** A folder / matter / case / patient grouping. */
export interface VaultFolder {
  id: string;
  /** Display name — stored locally only */
  name: string;
  /** Optional description */
  description?: string;
  /** Folder colour for visual organization */
  color?: string;
  /** Parent folder ID for nesting (empty = root) */
  parentId: string;
  /** Creation timestamp (unix seconds) */
  createdAt: number;
  /** Last modification timestamp */
  updatedAt: number;
}

/** An encrypted document reference stored in the Vault. */
export interface VaultDocument {
  id: string;
  /** Folder this document belongs to */
  folderId: string;
  /** Original filename */
  filename: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes (original plaintext size) */
  size: number;
  /** SHA-256 hash of the plaintext for integrity */
  plaintextHash: string;
  /** Reference to encrypted blob in the storage driver */
  storageRefId: string;
  /** Storage driver ID that holds the blob */
  storageDriver: string;
  /** Base64-encoded AES-256-GCM key (encrypted with NIP-44 for the owner) */
  encryptedKey: string;
  /** Base64-encoded IV for AES-GCM decryption */
  iv: string;
  /** Status */
  status: 'active' | 'pending-deletion' | 'deleted';
  /** Retention policy for this document */
  retention: VaultRetention;
  /** Source: where this document came from */
  source: 'inbox' | 'upload' | 'secure-link';
  /** Optional: sender name (for inbox documents) */
  senderName?: string;
  /** Creation timestamp (unix seconds) */
  createdAt: number;
  /** Scheduled deletion timestamp (unix seconds, null = manual) */
  deleteAt: number | null;
}

/** Retention policy options. */
export type VaultRetention =
  | 'manual'            // keep until manually deleted
  | 'after-download'    // delete after first download
  | '24h'              // delete after 24 hours
  | '7d'               // delete after 7 days
  | '30d'              // delete after 30 days
  | '90d'              // delete after 90 days
  | '1y';              // delete after 1 year

// ─── Local persistence ───────────────────────────────────────────────

const FOLDERS_KEY = 'privatum:vault:folders';
const DOCUMENTS_KEY = 'privatum:vault:documents';

/** Load all folders from local storage. */
export function loadFolders(): VaultFolder[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    return raw ? JSON.parse(raw) as VaultFolder[] : [];
  } catch {
    return [];
  }
}

/** Save all folders to local storage. */
export function saveFolders(folders: VaultFolder[]): void {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

/** Load all document references from local storage. */
export function loadDocuments(): VaultDocument[] {
  try {
    const raw = localStorage.getItem(DOCUMENTS_KEY);
    return raw ? JSON.parse(raw) as VaultDocument[] : [];
  } catch {
    return [];
  }
}

/** Save all document references to local storage. */
export function saveDocuments(documents: VaultDocument[]): void {
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents));
}

// ─── Folder operations ───────────────────────────────────────────────

export function createFolder(name: string, parentId: string = '', description?: string, color?: string): VaultFolder {
  const now = Math.floor(Date.now() / 1000);
  const folder: VaultFolder = {
    id: `folder-${now}-${crypto.getRandomValues(new Uint8Array(4)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '')}`,
    name,
    description,
    color,
    parentId,
    createdAt: now,
    updatedAt: now,
  };

  const folders = loadFolders();
  folders.push(folder);
  saveFolders(folders);

  return folder;
}

export function updateFolder(id: string, updates: Partial<Pick<VaultFolder, 'name' | 'description' | 'color' | 'parentId'>>): VaultFolder | null {
  const folders = loadFolders();
  const idx = folders.findIndex((f) => f.id === id);
  if (idx === -1) return null;

  folders[idx] = {
    ...folders[idx],
    ...updates,
    updatedAt: Math.floor(Date.now() / 1000),
  };
  saveFolders(folders);
  return folders[idx];
}

export function deleteFolder(id: string): boolean {
  const folders = loadFolders();
  const filtered = folders.filter((f) => f.id !== id);
  if (filtered.length === folders.length) return false;
  saveFolders(filtered);

  // Also remove all documents in this folder
  const docs = loadDocuments();
  saveDocuments(docs.filter((d) => d.folderId !== id));

  return true;
}

// ─── Document operations ─────────────────────────────────────────────

export function addDocument(doc: Omit<VaultDocument, 'id' | 'createdAt'>): VaultDocument {
  const now = Math.floor(Date.now() / 1000);
  const document: VaultDocument = {
    ...doc,
    id: `doc-${now}-${crypto.getRandomValues(new Uint8Array(4)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '')}`,
    createdAt: now,
  };

  const documents = loadDocuments();
  documents.push(document);
  saveDocuments(documents);

  return document;
}

export function getDocumentsInFolder(folderId: string): VaultDocument[] {
  return loadDocuments().filter((d) => d.folderId === folderId && d.status === 'active');
}

export function markDocumentDeleted(docId: string): boolean {
  const documents = loadDocuments();
  const idx = documents.findIndex((d) => d.id === docId);
  if (idx === -1) return false;

  documents[idx].status = 'deleted';
  saveDocuments(documents);
  return true;
}

export function getDocumentById(docId: string): VaultDocument | undefined {
  return loadDocuments().find((d) => d.id === docId);
}

// ─── Retention helpers ───────────────────────────────────────────────

/** Compute the deletion timestamp for a given retention policy. */
export function computeDeleteAt(retention: VaultRetention, fromTimestamp: number): number | null {
  switch (retention) {
    case 'manual': return null;
    case 'after-download': return null; // handled on download
    case '24h': return fromTimestamp + 86400;
    case '7d': return fromTimestamp + 604800;
    case '30d': return fromTimestamp + 2592000;
    case '90d': return fromTimestamp + 7776000;
    case '1y': return fromTimestamp + 31536000;
  }
}

/** Get all documents past their deletion deadline. */
export function getExpiredDocuments(): VaultDocument[] {
  const now = Math.floor(Date.now() / 1000);
  return loadDocuments().filter(
    (d) => d.status === 'active' && d.deleteAt !== null && d.deleteAt <= now
  );
}

// ─── Stats ───────────────────────────────────────────────────────────

export function getVaultStats() {
  const docs = loadDocuments().filter((d) => d.status === 'active');
  const folders = loadFolders();
  const totalSize = docs.reduce((sum, d) => sum + d.size, 0);
  const pendingDeletions = docs.filter((d) => d.deleteAt !== null).length;

  return {
    documentCount: docs.length,
    folderCount: folders.length,
    totalSize,
    pendingDeletions,
  };
}
