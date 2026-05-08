// Stable per-device ID combining a localStorage UUID + a lightweight browser fingerprint.
// Not bulletproof (users can clear storage) but good enough to discourage casual abuse.

const KEY = 'dukanpay_device_id_v1';

function fingerprint(): string {
  try {
    const parts = [
      navigator.userAgent,
      navigator.language,
      String(screen.width) + 'x' + String(screen.height),
      String(screen.colorDepth),
      String(new Date().getTimezoneOffset()),
      String(navigator.hardwareConcurrency || ''),
    ];
    let h = 0;
    const s = parts.join('|');
    for (let i = 0; i < s.length; i++) {
      h = (h << 5) - h + s.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h).toString(36);
  } catch {
    return 'nofp';
  }
}

export function getDeviceId(): string {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      const rand = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36));
      id = `dev_${fingerprint()}_${rand}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return `dev_${fingerprint()}_ephemeral`;
  }
}
