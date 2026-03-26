import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';
import type { Scan, PaginatedScans, UserProfile, UserStats, SavedScanRecord, ClickRecord } from '../types/api';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

// Callback set by AuthProvider so api layer can force sign-out without hooks
let onForceSignOut: (() => void) | null = null;

export function setForceSignOut(cb: () => void) {
  onForceSignOut = cb;
}

async function getAuthToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function rawFetch(path: string, token: string | null, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);

  try {
    return await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  let res = await rawFetch(path, token, options);

  // 429 — rate limited, do not retry
  if (res.status === 429) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Too many requests. Please slow down.');
  }

  // 401 interceptor: attempt a single token refresh
  if (res.status === 401) {
    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session) {
      await supabase.auth.signOut().catch(() => {});
      onForceSignOut?.();
      throw new Error('Your session has expired. Please sign in again.');
    }

    // Only retry idempotent (GET) requests automatically.
    // Non-GET requests (POST, PUT, DELETE) could cause duplicate side effects,
    // so we refresh the token but let the caller decide whether to retry.
    const method = (options.method ?? 'GET').toUpperCase();
    if (method === 'GET') {
      res = await rawFetch(path, data.session.access_token, options);
    } else {
      throw new Error('Your session was refreshed. Please try again.');
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }

  return res.json();
}

export async function scanProduct(imageUri: string): Promise<Scan> {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return apiFetch<Scan>('/api/scan', {
    method: 'POST',
    body: JSON.stringify({ imageBase64: base64 }),
  });
}

export async function getScan(scanId: string): Promise<Scan> {
  return apiFetch<Scan>(`/api/scan/${encodeURIComponent(scanId)}`);
}

export async function getScans(page: number = 1): Promise<PaginatedScans> {
  return apiFetch<PaginatedScans>(`/api/scans?page=${page}&limit=20`);
}

export async function retryScan(scanId: string, correctedProductName: string): Promise<Scan> {
  return apiFetch<Scan>(`/api/scan/${encodeURIComponent(scanId)}/retry`, {
    method: 'POST',
    body: JSON.stringify({ correctedProductName }),
  });
}

export async function saveScan(scanId: string): Promise<SavedScanRecord> {
  return apiFetch<SavedScanRecord>(`/api/scan/${encodeURIComponent(scanId)}/save`, { method: 'POST' });
}

export async function unsaveScan(scanId: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/api/scan/${encodeURIComponent(scanId)}/save`, { method: 'DELETE' });
}

export async function getSavedScans(): Promise<(SavedScanRecord & { scan?: Scan })[]> {
  const res = await apiFetch<{ savedScans: (SavedScanRecord & { scan?: Scan })[]; pagination: any }>('/api/user/saved-scans');
  return res.savedScans;
}

export async function isScanSaved(scanId: string): Promise<boolean> {
  const saved = await getSavedScans();
  return saved.some((s) => s.scanId === scanId);
}

export async function getUserProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/user/profile');
}

export async function getUserStats(): Promise<UserStats> {
  return apiFetch<UserStats>('/api/user/stats');
}

export async function trackClick(scanId: string, dealId: string, retailer: string, price: number): Promise<ClickRecord> {
  return apiFetch<ClickRecord>('/api/track/click', {
    method: 'POST',
    body: JSON.stringify({ scanId, dealId, retailer, price }),
  });
}

export async function syncSubscription(status: 'free' | 'pro'): Promise<{ subscriptionStatus: string }> {
  return apiFetch<{ subscriptionStatus: string }>('/api/user/sync-subscription', {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
}

export async function updateEmail(email: string): Promise<UserProfile> {
  return apiFetch<UserProfile>('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify({ email }),
  });
}

export async function deleteAccount(): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/api/user/account', {
    method: 'DELETE',
  });
}
