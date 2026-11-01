// Helper to capture and persist AI Studio auth parameters and supply Gemini API key

const STORAGE_KEY = 'aistudio_auth_params';
const PERMANENT_TOKEN_KEY = 'aistudio_auth_token_permanent';
const GEMINI_CACHE_KEY = 'aistudio_gemini_key_cache';

// Capture auth tokens from URL or hash on initial page load
if (typeof window !== 'undefined') {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    let authToken = searchParams.get('___aistudio_auth_token');
    let sessionIndex = searchParams.get('___session_index');
    let storageAccess = searchParams.get('___storage_access_granted');

    if (!authToken && window.location.hash) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        authToken = hashParams.get('___aistudio_auth_token');
      } catch {}
    }

    if (authToken || sessionIndex || storageAccess) {
      const authData = {
        authToken: authToken || '',
        sessionIndex: sessionIndex || '',
        storageAccess: storageAccess || 'true',
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
      if (authToken) {
        localStorage.setItem(PERMANENT_TOKEN_KEY, authToken);
      }
    }
  } catch {
    // Ignore storage errors
  }
}

export function buildApiUrl(endpointPath: string): string {
  if (typeof window === 'undefined') return endpointPath;

  try {
    const url = new URL(endpointPath, window.location.origin);
    const searchParams = new URLSearchParams(window.location.search);

    let authToken = searchParams.get('___aistudio_auth_token');
    let sessionIndex = searchParams.get('___session_index');
    let storageAccess = searchParams.get('___storage_access_granted');

    if (!authToken) {
      const savedRaw = sessionStorage.getItem(STORAGE_KEY);
      if (savedRaw) {
        try {
          const saved = JSON.parse(savedRaw);
          if (saved.authToken) authToken = saved.authToken;
          if (!sessionIndex && saved.sessionIndex) sessionIndex = saved.sessionIndex;
          if (!storageAccess && saved.storageAccess) storageAccess = saved.storageAccess;
        } catch {}
      }
    }

    if (!authToken) {
      const permToken = localStorage.getItem(PERMANENT_TOKEN_KEY);
      if (permToken) {
        authToken = permToken;
      }
    }

    if (authToken) {
      url.searchParams.set('___aistudio_auth_token', authToken);
    }
    if (sessionIndex) {
      url.searchParams.set('___session_index', sessionIndex);
    }
    if (storageAccess) {
      url.searchParams.set('___storage_access_granted', storageAccess);
    }

    return url.toString();
  } catch {
    return endpointPath;
  }
}

declare const __GEMINI_API_KEY__: string | undefined;

let cachedApiKey = '';

export function getGeminiApiKey(): string {
  try {
    if (typeof __GEMINI_API_KEY__ !== 'undefined' && __GEMINI_API_KEY__ && __GEMINI_API_KEY__.length > 5) {
      return __GEMINI_API_KEY__;
    }
  } catch {}

  try {
    const viteKey = import.meta.env.VITE_GEMINI_API_KEY || (import.meta.env as any).GEMINI_API_KEY;
    if (typeof viteKey === 'string' && viteKey.length > 5) {
      return viteKey;
    }
  } catch {}

  try {
    const procKey = process.env.GEMINI_API_KEY;
    if (typeof procKey === 'string' && procKey.length > 5) {
      return procKey;
    }
  } catch {}

  if (cachedApiKey && cachedApiKey.length > 5) {
    return cachedApiKey;
  }

  try {
    const stored = localStorage.getItem(GEMINI_CACHE_KEY);
    if (stored && stored.length > 5) {
      cachedApiKey = stored;
      return stored;
    }
  } catch {}

  return '';
}

export async function fetchGeminiApiKey(): Promise<string> {
  const existingKey = getGeminiApiKey();
  if (existingKey && existingKey.length > 5) {
    return existingKey;
  }

  try {
    const healthUrl = buildApiUrl('/api/health');
    const res = await fetch(healthUrl, { method: 'GET', credentials: 'include' });
    const contentType = res.headers.get('content-type') || '';

    if (res.ok && contentType.includes('application/json')) {
      const data = await res.json();
      if (data?.apiKey && typeof data.apiKey === 'string' && data.apiKey.length > 5) {
        cachedApiKey = data.apiKey;
        try {
          localStorage.setItem(GEMINI_CACHE_KEY, data.apiKey);
        } catch {}
        return cachedApiKey;
      }
    }
  } catch (e) {
    console.warn('[apiAuth] Failed to fetch key from health endpoint:', e);
  }

  return getGeminiApiKey();
}
