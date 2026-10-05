# Privatum — Nostr Event Schemas

Privatum uses Nostr as an invisible identity, signalling, and permission layer.
End users never encounter Nostr terminology.

## Architecture

- **Identity:** Standard Nostr keypairs (NIP-01) with client-side key generation.
- **Signer abstraction:** Pluggable signing methods (local nsec, NIP-07 extension, NIP-46 bunker). Users never see raw keys.
- **Encryption:** NIP-44 for all encrypted payloads.
- **Messaging:** NIP-17 private direct messages, sealed (NIP-59 kind 13) and gift-wrapped (NIP-59 kind 1059). **IMPLEMENTED (Phase IV).**
- **Profile:** Kind 0 for professional metadata with Privatum extensions.
- **Relay list:** Kind 10002 (NIP-65) for relay configuration.

## Professional Profile (Kind 0 extension) — IMPLEMENTED

Standard kind 0 with additional Privatum-specific fields in the content JSON.
Parsed via `parsePrivatumProfile()` in `src/lib/signer/index.ts`.

```json
{
  "name": "Dr. Anna Meier",
  "about": "Rechtsanwältin / Attorney at Law",
  "picture": "https://...",
  "website": "https://meier-law.ch",
  "privatum_handle": "anna-meier",
  "privatum_title": "Rechtsanwältin",
  "privatum_jurisdiction": "Zürich, Schweiz",
  "privatum_verification_tier": "self-declared",
  "privatum_verified_domain": "meier-law.ch",
  "privatum_verification_source": "Zürcher Anwaltsverband",
  "privatum_verification_date": "2026-01-15",
  "privatum_retention": "30d"
}
```

### Verification Tiers (§4)

Three visually distinct, honestly labeled tiers:

1. **`self-declared`** — Default at signup. Label: "Selbstangaben" / "Self-declared".
2. **`domain-verified`** — Control of firm domain proven (DNS/email challenge). Label: "Domain verifiziert".
3. **`register-verified`** — Checked against a professional register. Only tier that displays the brass seal. Label: "Verifiziert".

Verification is **never** implied or faked. Tier is stored in the kind 0 event
and displayed via the `VerificationBadge` component.

## Signer Abstraction (§4)

Signing methods are pluggable from day one. The abstraction supports:
- **Local (nsec):** Key in browser localStorage (via nostr-tools)
- **Extension (NIP-07):** Browser extension signing
- **Bunker (NIP-46):** Remote signer / FROST multi-signer bunker

Future: passkeys (WebAuthn), hardware keys, mobile signer.

The signer info is available via `getSignerInfo()` in `src/lib/signer/index.ts`,
enabling feature gating based on signer capabilities (NIP-44 support, FROST support, etc.).

## Encrypted Document Reference (future addressable kind)

Will use an addressable kind (30000-39999 range) to store encrypted
references to documents. The event content will be NIP-44 encrypted,
containing:
- AES-256-GCM key for the document
- IV for the document
- Storage driver + location reference
- File metadata (name, size, type)

The event tags will contain only:
- `d` tag: channel identifier
- `p` tag: authorized recipient pubkey
- `expiration` tag: retention deadline
- `alt` tag: "Encrypted document reference"

## Hash Chain Entry (future regular kind)

Will use a regular kind (1000-9999 range) to record integrity
chain entries. Content will be empty. Tags:
- `d` tag: entry hash
- `hash` tag: document SHA-256 hash
- `prev` tag: previous entry hash (empty for genesis)
- `channel` tag: channel identifier
- `direction` tag: "inbound" or "outbound"
- `alt` tag: "Privatum integrity chain entry"

## Secure Messaging (NIP-17 / NIP-59) — IMPLEMENTED (Phase IV)

Professionals correspond with clients and colleagues over an end-to-end
encrypted channel. Privatum does not define a new kind here; it uses the
standard NIP-17 sealed-DM flow so messages interoperate with the wider
Nostr DM ecosystem.

Layers (see `src/lib/messaging/index.ts`):

1. **Rumor — kind 14 (unsigned).** The plaintext chat message. Tags:
   - `p` tag: recipient pubkey.
   - `privatum-attachment` tag (optional, Privatum extension):
     `["privatum-attachment", filename, size, sha256Hash, vaultDocumentId]`.
     This is only a *reference* to an encrypted Vault document — the
     document contents are never placed in the event.
2. **Seal — kind 13.** The rumor, NIP-44-encrypted to the recipient and
   signed by the real sender. Created via the user's signer.
3. **Gift wrap — kind 1059.** The seal, NIP-44-encrypted to the recipient
   and signed by a one-time ephemeral key, `p`-tagged to the recipient.
   `created_at` is randomized up to two days in the past (NIP-59) to blur
   metadata. Two wraps are produced per message: one to the recipient and
   one to the sender (self-copy for multi-device).

The ephemeral gift-wrap layer uses `nostr-tools` NIP-44 primitives
directly (the app signer only knows the user's own key); the inner seal
uses the user's signer.

Decrypted plaintext is cached locally (`privatum:messages:conversations`)
so the UI is instant and offline-capable. The cache holds only what this
device already decrypted. Every sent/received message is recorded in the
integrity hash chain on the `messages` channel (metadata only — filename,
size, and hash; never content).

## Verified Contact Discovery (NIP-05) — IMPLEMENTED (Phase V)

So users never paste raw public keys, Privatum resolves professionals and
clients by DNS-based identifier (NIP-05). See `src/lib/nip05/index.ts` and
`src/lib/contacts/index.ts`.

- **Resolution:** `name@domain` → GET `https://<domain>/.well-known/nostr.json?name=<local>`.
  Redirects are refused per NIP-05. Direct fetch is attempted first; on
  CORS/network failure we retry through the configured CORS proxy. A bare
  `@domain` / `domain` is treated as the root identifier `_@domain`.
- **Reverse check:** after resolving, we fetch the pubkey's kind-0 and
  confirm its `nip05` field points back at the same identifier before
  marking the contact `nip05Verified`. When a user pastes an npub/hex, we
  still resolve any advertised `nip05` to display a verified identifier.
- **Primary reference is the pubkey.** The stored contact is keyed by hex
  pubkey and never silently re-pointed if the domain later maps the name to
  a different key (NIP-05 §"Clients must always follow public keys"). The
  NIP-05 string is kept only as a display/verification hint.
- **Trust display:** verification tier comes from the Privatum kind-0
  extension (`privatum_verification_tier`) and is shown with the existing
  `VerificationBadge`. Relay hints from the NIP-05 `relays` map are stored
  for future targeted delivery.

Contacts live in `privatum:contacts` (localStorage) and feed the directory,
the Dashboard contacts tab, and the secure-messaging recipient picker. No
new event kind is introduced — discovery is pure NIP-05 + kind 0.

## Storage Layer

Documents are NOT stored as Nostr events. Nostr events only coordinate
encrypted references, permissions, and integrity proofs. Large files use
a pluggable storage interface with Swiss-managed storage as default.
