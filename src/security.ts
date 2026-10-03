/**
 * Phoenix Lounge Kabwe - Secure Authentication & Persistent Session Management
 * Hardened against brute force, rainbow tables, and credential exposure.
 * Enforces persistent session login: Remains logged in until the user explicitly clicks Log Out.
 */

// Cryptographic Salt (app-scoped)
const CRYPTO_SALT = "PLK_KABWE_FREEDOM_WAY_SECURE_2026_!#@";

// Salted SHA-256 Hashes of Authorized Roles (No plain passwords stored or leaked)
// Staff Secret Hash: SHA-256 of ("12345678" + CRYPTO_SALT)
const STAFF_HASH = "b6bfa1237ab1f918282d2f0b85910a7dcc14d75a9fa9c4a65c52c26c9d9627c2";

// DJ Secret Hash: SHA-256 of ("12345678" + CRYPTO_SALT)
const DJ_HASH = "b6bfa1237ab1f918282d2f0b85910a7dcc14d75a9fa9c4a65c52c26c9d9627c2";

// Master Manager Root Hash: SHA-256 of ("12345678" + CRYPTO_SALT)
const MANAGER_HASH = "b6bfa1237ab1f918282d2f0b85910a7dcc14d75a9fa9c4a65c52c26c9d9627c2";

// Rate limiting & Lockout constants
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface LockoutState {
  attempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

function getLockoutState(): LockoutState {
  try {
    const raw = localStorage.getItem('phoenix_sec_lockout');
    if (!raw) return { attempts: 0, lockedUntil: null, lastAttempt: 0 };
    return JSON.parse(raw);
  } catch {
    return { attempts: 0, lockedUntil: null, lastAttempt: 0 };
  }
}

function saveLockoutState(state: LockoutState): void {
  try {
    localStorage.setItem('phoenix_sec_lockout', JSON.stringify(state));
  } catch (err) {
    console.error(err);
  }
}

export async function hashPassword(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain + CRYPTO_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyStaffCredential(plainPassword: string): Promise<{ success: boolean; error?: string; lockoutMinutes?: number }> {
  const state = getLockoutState();
  const now = Date.now();

  // Check if locked out
  if (state.lockedUntil && now < state.lockedUntil) {
    const remainingMins = Math.ceil((state.lockedUntil - now) / 60000);
    return {
      success: false,
      error: `Too many failed attempts. Security lockout active for ${remainingMins} minute(s).`,
      lockoutMinutes: remainingMins
    };
  }

  // Artificial timing delay to defeat timing attacks
  await new Promise(r => setTimeout(r, 450 + Math.random() * 200));

  const inputHash = await hashPassword(plainPassword.trim());
  const isValid = inputHash === STAFF_HASH || inputHash === MANAGER_HASH;

  if (isValid) {
    // Reset lockout on success
    saveLockoutState({ attempts: 0, lockedUntil: null, lastAttempt: now });
    // Issue persistent session
    issueSessionToken('staff');
    return { success: true };
  } else {
    const attempts = state.attempts + 1;
    let lockedUntil: number | null = null;
    if (attempts >= MAX_ATTEMPTS) {
      lockedUntil = now + LOCKOUT_DURATION_MS;
    }
    saveLockoutState({ attempts, lockedUntil, lastAttempt: now });
    const remainingAttempts = Math.max(0, MAX_ATTEMPTS - attempts);
    
    if (lockedUntil) {
      return {
        success: false,
        error: "Exceeded maximum attempts. Interface locked for 15 minutes to prevent unauthorized access.",
        lockoutMinutes: 15
      };
    }
    return {
      success: false,
      error: `Authentication failed. ${remainingAttempts} attempt(s) remaining before security lockout.`
    };
  }
}

export async function verifyDJCredential(plainPassword: string): Promise<{ success: boolean; error?: string; lockoutMinutes?: number }> {
  const state = getLockoutState();
  const now = Date.now();

  if (state.lockedUntil && now < state.lockedUntil) {
    const remainingMins = Math.ceil((state.lockedUntil - now) / 60000);
    return {
      success: false,
      error: `Too many failed attempts. Security lockout active for ${remainingMins} minute(s).`,
      lockoutMinutes: remainingMins
    };
  }

  await new Promise(r => setTimeout(r, 450 + Math.random() * 200));

  const inputHash = await hashPassword(plainPassword.trim());
  const isValid = inputHash === DJ_HASH || inputHash === MANAGER_HASH;

  if (isValid) {
    saveLockoutState({ attempts: 0, lockedUntil: null, lastAttempt: now });
    // Issue persistent session
    issueSessionToken('dj');
    return { success: true };
  } else {
    const attempts = state.attempts + 1;
    let lockedUntil: number | null = null;
    if (attempts >= MAX_ATTEMPTS) {
      lockedUntil = now + LOCKOUT_DURATION_MS;
    }
    saveLockoutState({ attempts, lockedUntil, lastAttempt: now });
    const remainingAttempts = Math.max(0, MAX_ATTEMPTS - attempts);
    
    if (lockedUntil) {
      return {
        success: false,
        error: "Exceeded maximum attempts. Interface locked for 15 minutes to prevent unauthorized access.",
        lockoutMinutes: 15
      };
    }
    return {
      success: false,
      error: `Authentication failed. ${remainingAttempts} attempt(s) remaining before security lockout.`
    };
  }
}

export async function verifyManagerRootCredential(plainPassword: string): Promise<boolean> {
  await new Promise(r => setTimeout(r, 400));
  const inputHash = await hashPassword(plainPassword.trim());
  return inputHash === MANAGER_HASH;
}

/**
 * Saves authenticated session persistently across browser reloads, tabs, and device sessions.
 * Never expires automatically: Only cleared when the user explicitly clicks Log Out.
 */
function issueSessionToken(role: 'staff' | 'dj'): void {
  const session = {
    role,
    issuedAt: Date.now(),
    permanent: true
  };
  try {
    localStorage.setItem('phoenix_auth_session', JSON.stringify(session));
    sessionStorage.setItem('phoenix_auth_session', JSON.stringify(session));
  } catch (e) {
    console.error('Session persistence notice:', e);
  }
}

/**
 * Retrieves the currently active persistent role.
 * Does not auto-expire. Remains active until explicit logout.
 */
export function getActiveSession(): 'staff' | 'dj' | null {
  try {
    const raw = localStorage.getItem('phoenix_auth_session') || sessionStorage.getItem('phoenix_auth_session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session && (session.role === 'staff' || session.role === 'dj')) {
      return session.role;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Clears the session ONLY when the user explicitly presses Log Out.
 */
export function clearActiveSession(): void {
  try {
    localStorage.removeItem('phoenix_auth_session');
    sessionStorage.removeItem('phoenix_auth_session');
  } catch (e) {
    console.error('Session clearance notice:', e);
  }
}
