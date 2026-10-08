import Constants from 'expo-constants';
import { Platform } from 'react-native';

const VERSION_PREFIX = '/v1';
const REQUEST_TIMEOUT_MS = 20_000;

/**
 * Resolves the API base URL.
 *
 * `EXPO_PUBLIC_API_URL` wins when set, which is what you configure for staging
 * and production. Without it we fall back to the LAN address of the machine
 * running `php artisan serve` (Metro exposes that host), so a physical device
 * on the same network works with zero configuration. Android emulators reach
 * the host through `10.0.2.2` instead of `localhost`.
 */
export function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (configured) {
    return stripTrailingSlash(configured);
  }

  if (Platform.OS === 'web') {
    return `http://localhost${VERSION_PREFIX}`;
  }

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const host = hostUri?.split(':')[0];

  if (host && host.length > 0) {
    return `http://${host}:8000${VERSION_PREFIX}`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:8000${VERSION_PREFIX}`;
  }

  return `http://127.0.0.1:8000${VERSION_PREFIX}`;
}

export const API_BASE_URL = resolveApiBaseUrl();

/** Error carrying the HTTP status and the Laravel validation payload. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** First validation message for a field, if the API returned any. */
  fieldError(field: string): string | null {
    return this.errors[field]?.[0] ?? null;
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** JSON body, serialised automatically. */
  body?: unknown;
  /** Multipart body; takes precedence over `body`. */
  formData?: FormData;
  token?: string | null;
  signal?: AbortSignal;
};

/**
 * Thin fetch wrapper shared by every endpoint module: JSON in, JSON out,
 * typed errors, and a timeout so a hung request never freezes the UI.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, formData, token, signal } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  if (signal) {
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const headers: Record<string, string> = { Accept: 'application/json' };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let payload: BodyInit | undefined;

  if (formData) {
    // Never set Content-Type manually: fetch must add the multipart boundary.
    payload = formData;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: payload,
      signal: controller.signal,
    });

    if (response.status === 204) {
      return {} as T;
    }

    const text = await response.text();
    const json = text.length > 0 ? safeJsonParse(text) : {};

    if (!response.ok) {
      throw new ApiError(
        extractMessage(json) ?? `Request failed with status ${response.status}.`,
        response.status,
        extractErrors(json),
      );
    }

    return json as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('The request timed out. Check your connection.', 408);
    }

    throw new ApiError(
      `Cannot reach the API at ${API_BASE_URL}. Check that the server is running.`,
      0,
    );
  } finally {
    clearTimeout(timeout);
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function extractMessage(payload: unknown): string | null {
  if (isRecord(payload) && typeof payload.message === 'string' && payload.message.length > 0) {
    return payload.message;
  }

  return null;
}

function extractErrors(payload: unknown): Record<string, string[]> {
  if (!isRecord(payload) || !isRecord(payload.errors)) {
    return {};
  }

  const result: Record<string, string[]> = {};

  for (const [field, messages] of Object.entries(payload.errors)) {
    if (Array.isArray(messages)) {
      result[field] = messages.filter((message): message is string => typeof message === 'string');
    }
  }

  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stripTrailingSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}
