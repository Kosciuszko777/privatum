/**
 * useVault — Reactive vault state management.
 *
 * Provides CRUD operations for folders and documents with
 * automatic re-renders. Wraps the vault lib's localStorage
 * persistence with React state.
 */

import { useState, useCallback, useMemo } from 'react';
import {
  loadFolders, saveFolders,
  loadDocuments, saveDocuments,
  computeDeleteAt,
  type VaultFolder, type VaultDocument, type VaultRetention,
} from '@/lib/vault';
import { encryptFile, hashFile, arrayBufferToBase64 } from '@/lib/cryptvault';
import { getStorageDriver } from '@/lib/storage';
import { demoVaultFolders, demoVaultDocuments, demoAccessGrants } from '@/lib/demoData';
import type { DemoVaultFolder, DemoVaultDocument, DemoAccessGrant } from '@/lib/demoData';

/** Unified folder shape for UI rendering (covers both demo and real). */
export interface DisplayFolder {
  id: string;
  name: string;
  description?: string;
  color: string;
  documentCount: number;
  totalSize: number;
  lastActivity: string;
  isDemo: boolean;
}

/** Unified document shape for UI rendering. */
export interface DisplayDocument {
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
  isDemo: boolean;
}

const FOLDER_COLORS = ['#6E1F2E', '#3A6B5E', '#B08D45', '#5B7EA1', '#8B6F4E', '#7B3F8C', '#2D6A4F', '#C45D3E'];

function randomColor(): string {
  return FOLDER_COLORS[Math.floor(Math.random() * FOLDER_COLORS.length)];
}

function formatUnixDate(ts: number): string {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('de-CH', { day: 'numeric', month: 'long', year: 'numeric' });
}

function toDisplayFolder(f: VaultFolder, docs: VaultDocument[]): DisplayFolder {
  const folderDocs = docs.filter((d) => d.folderId === f.id && d.status !== 'deleted');
  return {
    id: f.id,
    name: f.name,
    description: f.description,
    color: f.color || randomColor(),
    documentCount: folderDocs.length,
    totalSize: folderDocs.reduce((sum, d) => sum + d.size, 0),
    lastActivity: formatUnixDate(f.updatedAt),
    isDemo: false,
  };
}

function toDisplayDocument(d: VaultDocument): DisplayDocument {
  return {
    id: d.id,
    folderId: d.folderId,
    filename: d.filename,
    mimeType: d.mimeType,
    size: d.size,
    status: d.status === 'deleted' ? 'active' : d.status,
    source: d.source,
    senderName: d.senderName,
    createdAt: formatUnixDate(d.createdAt),
    deleteAt: d.deleteAt ? formatUnixDate(d.deleteAt) : undefined,
    retention: d.retention,
    isDemo: false,
  };
}

function demoToDisplayFolder(f: DemoVaultFolder): DisplayFolder {
  return { ...f, isDemo: true };
}

function demoToDisplayDoc(d: DemoVaultDocument): DisplayDocument {
  return { ...d, isDemo: true };
}

export function useVault() {
  const [folders, setFolders] = useState<VaultFolder[]>(loadFolders);
  const [documents, setDocuments] = useState<VaultDocument[]>(loadDocuments);

  // ─── Merged display data (demo + real) ──────────────────────────

  const displayFolders = useMemo<DisplayFolder[]>(() => {
    const demoDisplay = demoVaultFolders.map(demoToDisplayFolder);
    const realDisplay = folders.map((f) => toDisplayFolder(f, documents));
    return [...demoDisplay, ...realDisplay];
  }, [folders, documents]);

  const displayDocuments = useMemo<DisplayDocument[]>(() => {
    const demoDisplay = demoVaultDocuments.map(demoToDisplayDoc);
    const realActive = documents.filter((d) => d.status !== 'deleted');
    const realDisplay = realActive.map(toDisplayDocument);
    return [...demoDisplay, ...realDisplay];
  }, [documents]);

  const displayGrants: DemoAccessGrant[] = demoAccessGrants;

  // ─── Stats ──────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const allDocs = displayDocuments.filter((d) => d.status === 'active');
    const totalSize = allDocs.reduce((sum, d) => sum + d.size, 0);
    const realDocs = documents.filter((d) => d.status !== 'deleted');
    return {
      documentCount: allDocs.length,
      folderCount: displayFolders.length,
      totalSize,
      realDocumentCount: realDocs.length,
      realFolderCount: folders.length,
      activePermissions: demoAccessGrants.filter((g) => g.status === 'active').length,
    };
  }, [displayDocuments, displayFolders, documents, folders]);

  // ─── Folder CRUD ────────────────────────────────────────────────

  const createFolder = useCallback((name: string, description?: string) => {
    const now = Math.floor(Date.now() / 1000);
    const folder: VaultFolder = {
      id: `folder-${now}-${crypto.getRandomValues(new Uint8Array(4)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '')}`,
      name,
      description,
      color: randomColor(),
      parentId: '',
      createdAt: now,
      updatedAt: now,
    };
    const updated = [...folders, folder];
    saveFolders(updated);
    setFolders(updated);
    return folder;
  }, [folders]);

  const renameFolder = useCallback((id: string, name: string) => {
    const updated = folders.map((f) =>
      f.id === id ? { ...f, name, updatedAt: Math.floor(Date.now() / 1000) } : f
    );
    saveFolders(updated);
    setFolders(updated);
  }, [folders]);

  const deleteFolder = useCallback((id: string) => {
    const updatedFolders = folders.filter((f) => f.id !== id);
    saveFolders(updatedFolders);
    setFolders(updatedFolders);

    // Also remove documents in this folder
    const updatedDocs = documents.filter((d) => d.folderId !== id);
    saveDocuments(updatedDocs);
    setDocuments(updatedDocs);
  }, [folders, documents]);

  // ─── Document upload (real encryption) ──────────────────────────

  const uploadFiles = useCallback(async (
    files: File[],
    folderId: string,
    retention: VaultRetention,
    onProgress?: (step: 'encrypting' | 'storing' | 'complete', pct: number) => void,
  ): Promise<VaultDocument[]> => {
    const driver = getStorageDriver();
    const results: VaultDocument[] = [];
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const basePct = (i / totalFiles) * 100;
      const filePct = 100 / totalFiles;

      // 1. Read file into ArrayBuffer
      const plaintext = await file.arrayBuffer();

      // 2. Hash plaintext for integrity
      onProgress?.('encrypting', Math.round(basePct + filePct * 0.1));
      const plaintextHash = await hashFile(plaintext);

      // 3. Encrypt with AES-256-GCM
      onProgress?.('encrypting', Math.round(basePct + filePct * 0.4));
      const { ciphertext, key, iv } = await encryptFile(plaintext);

      // 4. Store ciphertext in storage driver
      onProgress?.('storing', Math.round(basePct + filePct * 0.6));
      const storageRef = await driver.put(ciphertext, {
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
      });

      // 5. Save document reference (key + iv stored as base64)
      const now = Math.floor(Date.now() / 1000);
      const doc: VaultDocument = {
        id: `doc-${now}-${crypto.getRandomValues(new Uint8Array(4)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '')}`,
        folderId,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        plaintextHash,
        storageRefId: storageRef.id,
        storageDriver: storageRef.driver,
        encryptedKey: arrayBufferToBase64(key),
        iv: arrayBufferToBase64(iv),
        status: 'active',
        retention,
        source: 'upload',
        createdAt: now,
        deleteAt: computeDeleteAt(retention, now),
      };

      results.push(doc);
      onProgress?.('storing', Math.round(basePct + filePct * 0.9));
    }

    // Persist all at once
    const updatedDocs = [...documents, ...results];
    saveDocuments(updatedDocs);
    setDocuments(updatedDocs);

    // Update folder timestamps
    const updatedFolders = folders.map((f) =>
      f.id === folderId ? { ...f, updatedAt: Math.floor(Date.now() / 1000) } : f
    );
    saveFolders(updatedFolders);
    setFolders(updatedFolders);

    onProgress?.('complete', 100);
    return results;
  }, [documents, folders]);

  // ─── Move inbox delivery to vault ───────────────────────────────

  const moveDeliveryToVault = useCallback((
    delivery: { senderName: string; files: { name: string; size: number }[] },
    folderId: string,
    retention: VaultRetention,
  ) => {
    const now = Math.floor(Date.now() / 1000);
    const newDocs: VaultDocument[] = delivery.files.map((file) => ({
      id: `doc-${now}-${crypto.getRandomValues(new Uint8Array(4)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '')}`,
      folderId,
      filename: file.name,
      mimeType: file.name.endsWith('.pdf') ? 'application/pdf' : file.name.endsWith('.zip') ? 'application/zip' : 'application/octet-stream',
      size: file.size,
      plaintextHash: '',
      storageRefId: `demo-ref-${Date.now()}`,
      storageDriver: 'demo',
      encryptedKey: '',
      iv: '',
      status: 'active' as const,
      retention,
      source: 'inbox' as const,
      senderName: delivery.senderName,
      createdAt: now,
      deleteAt: computeDeleteAt(retention, now),
    }));

    const updatedDocs = [...documents, ...newDocs];
    saveDocuments(updatedDocs);
    setDocuments(updatedDocs);

    // Update folder timestamp
    const updatedFolders = folders.map((f) =>
      f.id === folderId ? { ...f, updatedAt: Math.floor(Date.now() / 1000) } : f
    );
    saveFolders(updatedFolders);
    setFolders(updatedFolders);

    return newDocs;
  }, [documents, folders]);

  // ─── Document deletion ──────────────────────────────────────────

  const deleteDocument = useCallback(async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) return false;

    // Delete from storage driver if real
    if (doc.storageDriver !== 'demo') {
      const driver = getStorageDriver();
      await driver.delete(doc.storageRefId);
    }

    const updatedDocs = documents.map((d) =>
      d.id === docId ? { ...d, status: 'deleted' as const } : d
    );
    saveDocuments(updatedDocs);
    setDocuments(updatedDocs);
    return true;
  }, [documents]);

  // ─── Document decrypt + download ────────────────────────────────

  const downloadDocument = useCallback(async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc || doc.storageDriver === 'demo') return false;

    const driver = getStorageDriver();
    const ciphertext = await driver.get(doc.storageRefId);
    if (!ciphertext) return false;

    // Import the decryption modules dynamically to keep the bundle smaller
    const { decryptFile, base64ToArrayBuffer } = await import('@/lib/cryptvault');
    const key = base64ToArrayBuffer(doc.encryptedKey);
    const iv = base64ToArrayBuffer(doc.iv);
    const plaintext = await decryptFile(ciphertext, key, iv);

    // Trigger browser download
    const blob = new Blob([plaintext], { type: doc.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.filename;
    a.click();
    URL.revokeObjectURL(url);

    return true;
  }, [documents]);

  return {
    // Merged display data
    displayFolders,
    displayDocuments,
    displayGrants,
    stats,

    // Raw data
    folders,
    documents,

    // Folder ops
    createFolder,
    renameFolder,
    deleteFolder,

    // Document ops
    uploadFiles,
    moveDeliveryToVault,
    deleteDocument,
    downloadDocument,
  };
}
