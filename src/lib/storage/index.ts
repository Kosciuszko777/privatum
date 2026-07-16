/**
 * STORAGE ABSTRACTION — Pluggable storage drivers per §1.6.
 *
 * Large files are never stored as Nostr events.
 * The storage layer is an interface with pluggable drivers:
 * - Browser (IndexedDB) — default for local/demo
 * - Privatum-managed Swiss storage
 * - S3-compatible
 * - Customer-controlled / self-hosted
 * - Blossom-compatible
 *
 * Nostr events coordinate encrypted references and signed permissions only.
 */

/** Metadata returned after storing a blob. */
export interface StorageRef {
  /** Unique reference ID for retrieval */
  id: string;
  /** Storage driver that holds this blob */
  driver: string;
  /** Size in bytes of the stored (encrypted) data */
  size: number;
  /** SHA-256 hash of the plaintext (for integrity chain) */
  plaintextHash: string;
  /** SHA-256 hash of the ciphertext (for storage verification) */
  ciphertextHash: string;
  /** Unix timestamp of storage */
  storedAt: number;
}

/** Pluggable storage driver interface. */
export interface StorageDriver {
  /** Human-readable driver name */
  readonly name: string;
  /** Driver identifier */
  readonly id: string;

  /** Store encrypted data, returns a reference for retrieval. */
  put(data: ArrayBuffer, metadata: { filename: string; mimeType: string }): Promise<StorageRef>;

  /** Retrieve encrypted data by reference ID. */
  get(refId: string): Promise<ArrayBuffer | null>;

  /** Delete stored data by reference ID. Returns true if deleted. */
  delete(refId: string): Promise<boolean>;

  /** Check if a reference exists in storage. */
  exists(refId: string): Promise<boolean>;

  /** Get storage usage stats. */
  stats(): Promise<{ used: number; available: number | null }>;
}

/**
 * Browser-local storage driver using IndexedDB.
 * Default driver for offline-first local use.
 */
export class BrowserStorageDriver implements StorageDriver {
  readonly name = 'Browser (lokal)';
  readonly id = 'browser';

  private dbName = 'privatum-vault';
  private storeName = 'encrypted-blobs';

  private async openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async put(data: ArrayBuffer, metadata: { filename: string; mimeType: string }): Promise<StorageRef> {
    const id = `blob-${Date.now()}-${crypto.getRandomValues(new Uint8Array(8)).reduce((s, b) => s + b.toString(16).padStart(2, '0'), '')}`;

    // Hash the ciphertext for storage verification
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const ciphertextHash = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const db = await this.openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.put({ data, metadata, storedAt: Date.now() }, id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();

    return {
      id,
      driver: this.id,
      size: data.byteLength,
      plaintextHash: '', // caller must provide from before encryption
      ciphertextHash,
      storedAt: Math.floor(Date.now() / 1000),
    };
  }

  async get(refId: string): Promise<ArrayBuffer | null> {
    const db = await this.openDb();
    const result = await new Promise<{ data: ArrayBuffer } | undefined>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.get(refId);
      req.onsuccess = () => resolve(req.result as { data: ArrayBuffer } | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return result?.data ?? null;
  }

  async delete(refId: string): Promise<boolean> {
    const db = await this.openDb();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(this.storeName, 'readwrite');
        const store = tx.objectStore(this.storeName);
        store.delete(refId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      return true;
    } catch {
      return false;
    } finally {
      db.close();
    }
  }

  async exists(refId: string): Promise<boolean> {
    const db = await this.openDb();
    const result = await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.count(refId);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return result > 0;
  }

  async stats(): Promise<{ used: number; available: number | null }> {
    if ('estimate' in navigator.storage) {
      const est = await navigator.storage.estimate();
      return {
        used: est.usage ?? 0,
        available: est.quota ?? null,
      };
    }
    return { used: 0, available: null };
  }
}

/** Singleton default driver. */
let activeDriver: StorageDriver = new BrowserStorageDriver();

/** Get the current storage driver. */
export function getStorageDriver(): StorageDriver {
  return activeDriver;
}

/** Replace the active storage driver (e.g., switching to Swiss-hosted or S3). */
export function setStorageDriver(driver: StorageDriver): void {
  activeDriver = driver;
}
