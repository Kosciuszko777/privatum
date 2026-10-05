/**
 * TRUSTED CONTACTS — Phase V.
 *
 * A local registry of people the professional corresponds with, so secure
 * messages are addressed by name rather than by pasted public keys.
 *
 * Per NIP-05, the *primary reference is always the pubkey*, never the
 * identifier string. We store the resolved pubkey and keep the NIP-05
 * identifier only as a display/verification hint — if the domain later maps
 * the name to a different key, we surface a warning but never silently swap
 * the stored pubkey.
 */

import type { VerificationTier } from '@/lib/signer';

/** A saved contact. */
export interface Contact {
  /** Primary reference — hex pubkey (lowercase). Immutable once saved. */
  pubkey: string;
  /** Display name (from kind 0 or entered manually). */
  name: string;
  /** Professional title, if known. */
  title?: string;
  /** NIP-05 identifier used to find them (display/verification hint only). */
  nip05?: string;
  /** Whether the NIP-05 reverse-check passed at add time. */
  nip05Verified: boolean;
  /** Avatar URL (from kind 0). */
  picture?: string;
  /** Verification tier parsed from their Privatum profile. */
  verificationTier?: VerificationTier;
  /** Relay hints discovered via NIP-05. */
  relays: string[];
  /** When this contact was added (unix seconds). */
  addedAt: number;
}

const CONTACTS_KEY = 'privatum:contacts';

/** Load all saved contacts, most-recently-added first. */
export function loadContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    const list = raw ? (JSON.parse(raw) as Contact[]) : [];
    return list.sort((a, b) => b.addedAt - a.addedAt);
  } catch {
    return [];
  }
}

function saveContacts(contacts: Contact[]): void {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
}

/** Add or update a contact, keyed by pubkey. Returns the full updated list. */
export function upsertContact(contact: Omit<Contact, 'addedAt'> & { addedAt?: number }): Contact[] {
  const contacts = loadContacts();
  const existingIdx = contacts.findIndex((c) => c.pubkey === contact.pubkey);

  if (existingIdx >= 0) {
    const existing = contacts[existingIdx];
    contacts[existingIdx] = {
      ...existing,
      ...contact,
      // Never change the immutable primary reference or lose the original date.
      pubkey: existing.pubkey,
      addedAt: existing.addedAt,
    };
  } else {
    contacts.push({ ...contact, addedAt: contact.addedAt ?? Math.floor(Date.now() / 1000) });
  }

  saveContacts(contacts);
  return loadContacts();
}

/** Remove a contact by pubkey. Returns the updated list. */
export function removeContact(pubkey: string): Contact[] {
  const contacts = loadContacts().filter((c) => c.pubkey !== pubkey);
  saveContacts(contacts);
  return contacts;
}

/** Look up a saved contact by pubkey. */
export function getContact(pubkey: string): Contact | undefined {
  return loadContacts().find((c) => c.pubkey === pubkey);
}

/** Clear all contacts (used by panic-delete). */
export function clearContacts(): void {
  localStorage.removeItem(CONTACTS_KEY);
}
