# Privatum

### Private document transport.

**Attach without attaching.**

Privatum is a privacy-first protocol for sending sensitive documents without putting the document itself into email, chat, cloud storage, or another centralized intermediary.

Your email delivers the message.  
Privatum delivers the document.

The goal is simple:

> **No intermediary should need access to both your document and your relationship graph.**

---

## Why Privatum?

Email was designed to deliver messages, not confidential documents.

Yet every day we send:

- contracts
- financial statements
- passports
- tax documents
- medical records
- legal files
- board papers
- investment documents
- source material
- confidential reports

as ordinary email attachments.

This creates unnecessary copies across infrastructure:

**Sender → Email Provider → Mail Infrastructure → Recipient Provider → Recipient → Archives → Backups**

Encryption in transit helps protect the connection.

It does not eliminate the underlying problem:

**the document still travels through infrastructure you do not control.**

Secure cloud links improve this, but usually replace one trusted intermediary with another.

Privatum takes a different approach.

---

# The idea

Privatum treats confidential documents as something that should be **transported privately**, rather than permanently stored by an intermediary.

Instead of:

```text
Sender
  │
  ▼
Email Provider
  │
  ▼
Document Attachment
  │
  ▼
Recipient Mailbox
```

Privatum aims for:

```text
                    ┌── Route A ──┐
                    │             │
Sender → Encrypt → Split/Route ───┼──→ Authorized Recipient
                    │             │
                    └── Route B ──┘
                         ...
```

The email can contain the message and retrieval capability.

The document takes a different
