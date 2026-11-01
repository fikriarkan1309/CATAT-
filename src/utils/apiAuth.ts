// Helper to capture and persist AI Studio auth parameters for Nginx preview proxy on mobile devices

const STORAGE_KEY = 'aistudio_auth_params';

// Capture auth tokens from URL on initial page load
if (typeof window !== 'undefined') {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const authToken = searchParams.get('___aistudio_auth_token');
    const sessionIndex = searchParams.get('___session_index');
    const storageAccess = searchParams.get('___storage_access_granted');

    if (authToken || sessionIndex || storageAccess) {
      const authData = {
        authToken: authToken || '',
        sessionIndex: sessionIndex || '',
        storageAccess: storageAccess || 'true',
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
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

    if (!authToken || !sessionIndex) {
      const savedRaw = sessionStorage.getItem(STORAGE_KEY);
      if (savedRaw) {
        const saved = JSON.parse(savedRaw);
        if (!authToken && saved.authToken) authToken = saved.authToken;
        if (!sessionIndex && saved.sessionIndex) sessionIndex = saved.sessionIndex;
        if (!storageAccess && saved.storageAccess) storageAccess = saved.storageAccess;
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

export function getGeminiApiKey(): string {
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  if (typeof window !== 'undefined') {
    const metaEnv = (import.meta as any).env;
    if (metaEnv?.VITE_GEMINI_API_KEY) return metaEnv.VITE_GEMINI_API_KEY;
  }
  return '';
}
