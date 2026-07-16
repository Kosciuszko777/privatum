# Privatum — Nostr Event Schemas

Privatum uses Nostr as an invisible identity, signalling, and permission layer.
End users never encounter Nostr terminology.

## Architecture

- **Identity:** Standard Nostr keypairs (NIP-01) with client-side key generation.
- **Encryption:** NIP-44 for all encrypted payloads.
- **Messaging:** NIP-17/59 pattern for private messages (future Phase IV).
- **Profile:** Kind 0 for professional metadata.
- **Relay list:** Kind 10002 (NIP-65) for relay configuration.

## Custom Events (planned for Phase II+)

### Professional Profile (Kind 0 extension)

Standard kind 0 with additional fields in content JSON:

```json
{
  "name": "Dr. Anna Meier",
  "about": "Rechtsanwältin / Attorney at Law",
  "picture": "https://...",
  "privatum_handle": "anna-meier",
  "privatum_title": "Rechtsanwältin",
  "privatum_jurisdiction": "Zürich, Schweiz",
  "privatum_verification_tier": "register-verified"
}
```

### Encrypted Document Reference (future addressable kind)

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

### Hash Chain Entry (future regular kind)

Will use a regular kind (1000-9999 range) to record integrity
chain entries. Content will be empty. Tags:
- `d` tag: entry hash
- `hash` tag: document SHA-256 hash
- `prev` tag: previous entry hash (empty for genesis)
- `channel` tag: channel identifier
- `direction` tag: "inbound" or "outbound"
- `alt` tag: "Privatum integrity chain entry"

## Storage Layer

Documents are NOT stored as Nostr events. Nostr events only coordinate
encrypted references, permissions, and integrity proofs. Large files use
a pluggable storage interface with Swiss-managed storage as default.
