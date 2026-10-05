# Privatum

### Private document sharing over Nostr.

**Attach without attaching.**

Privatum is a simple, privacy-first way to send sensitive documents using **Nostr as the coordination and routing layer**.

Instead of attaching a confidential file to an email or uploading it to a centralized cloud provider, Privatum encrypts the document locally and uses Nostr-based infrastructure to coordinate secure delivery.

```text
Sender
   ↓
Local encryption
   ↓
Privatum
   ↓
Nostr relays / distributed routes
   ↓
Recipient
   ↓
Local decryption
```

## Why?

Email attachments create copies.

Cloud links create centralized dependencies.

Privatum is built around a different idea:

> **Don't trust a platform with the document.**

Nostr provides an open, decentralized communication layer based on cryptographic identities rather than platform accounts.

Privatum extends this principle to documents.

## How it works

1. Select a document.
2. Privatum encrypts it locally.
3. Nostr coordinates discovery, authorization and delivery.
4. The recipient proves access and retrieves the encrypted document.
5. The document is decrypted locally.

No Privatum account is required by design.

No Google Drive.

No Dropbox.

No centralized identity provider.

## Privacy architecture

Privatum is being designed around:

**Nostr identities** — cryptographic identity instead of platform accounts.

**Multiple relays** — no dependency on one communication provider.

**Local encryption** — plaintext never needs to reach Privatum infrastructure.

**Separate routing** — message,
