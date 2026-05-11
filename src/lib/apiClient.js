import { Platform } from 'react-native';
import { appLog } from './devLog';
import { getDevBackendHttpBase } from './devBackendHost';

const backendPort = process.env.EXPO_PUBLIC_DEV_BACKEND_PORT || '5050';

function getDefaultBaseUrl() {
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${backendPort}/api`;
  }
  return `http://localhost:${backendPort}/api`;
}

const explicitApi = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
const derivedBase = getDevBackendHttpBase();
const API_BASE_URL =
  explicitApi ||
  (derivedBase ? `${derivedBase}/api` : getDefaultBaseUrl());

function buildUrl(path, query) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const base = `${API_BASE_URL}${p}`;
  if (!query || typeof query !== 'object') return base;
  const qs = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `${base}?${s}` : base;
}

function redactBody(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = { ...obj };
  if (typeof out.email === 'string') {
    const e = out.email;
    out.email = e.length > 3 ? `${e.slice(0, 2)}***@${e.split('@')[1] || ''}` : '***';
  }
  return out;
}

async function request(path, { method = 'GET', body, headers, query } = {}) {
  const url = buildUrl(path, query);
  const started = Date.now();
  appLog('API', `→ ${method} ${url}`, body ? redactBody(body) : undefined);

  let resp;
  try {
    resp = await fetch(url, {
      method,
      headers: {
        ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
        ...(headers || {}),
      },
      body: body && method !== 'GET' ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    const raw = err && typeof err.message === 'string' ? err.message : String(err);
    appLog('API', `← ${method} ${path} FETCH FAILED`, raw);
    const hint =
      raw.includes('Network request failed') || raw.includes('Failed to fetch')
        ? ` Phone could not reach the API. Same Wi‑Fi as this PC? Remove EXPO_PUBLIC_API_BASE_URL from .env.local to auto-use Metro’s host + port ${backendPort}, or set it to http://<PC_LAN_IP>:${backendPort}/api (see Metro exp://… line). Restart Expo after changing env (npx expo start -c).`
        : '';
    throw new Error(`${raw}.${hint}`);
  }

  const isJson = (resp.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await resp.json() : await resp.text();
  const ms = Date.now() - started;

  if (!resp.ok) {
    const base =
      (typeof data === 'object' && data?.error) ||
      (typeof data === 'string' && data) ||
      `Request failed: ${resp.status}`;
    const hint = typeof data === 'object' && data?.hint ? `\n\n${data.hint}` : '';
    appLog('API', `← ${method} ${path} ${resp.status} (${ms}ms) ERROR`, typeof data === 'object' ? data : String(data).slice(0, 200));
    throw new Error(`${base}${hint}`);
  }

  const summary =
    typeof data === 'object' && data
      ? {
          keys: Object.keys(data),
          ok: data.ok,
          url: data.url ? '(stripe url)' : undefined,
          emailRedirectTo: data.emailRedirectTo,
          duration: data.duration,
          audioUrl: data.audioUrl ? '(url)' : undefined,
          scriptPreview: data.script ? `${String(data.script).slice(0, 60)}…` : undefined,
        }
      : String(data).slice(0, 120);

  appLog('API', `← ${method} ${path} ${resp.status} (${ms}ms) OK`, summary);
  return data;
}

export const apiClient = {
  get: (path, query) => request(path, { method: 'GET', query }),
  post: (path, body) => request(path, { method: 'POST', body }),
};

export { API_BASE_URL };

