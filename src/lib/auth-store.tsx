import { ApiError } from '@/lib/api';
import { auth } from '@/lib/endpoints';
import type { ApiUser } from '@/lib/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aesDecryptAsync, aesEncryptAsync, AESEncryptionKey, AESSealedData } from 'expo-crypto';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Platform } from 'react-native';

const TOKEN_KEY = 'ride_efficiency_token';
const USER_KEY = 'ride_efficiency_user';
const ENCRYPTION_KEY_KEY = 'ride_efficiency_encryption_key';

/**
 * `expo-secure-store` has no web implementation, so the token falls back to
 * AsyncStorage when the app runs on the web target. Native builds always use
 * the Keychain / Keystore.
 *
 * NOTE: Web does not use encryption because SecureStore is not available.
 * For production web apps, consider using a more secure storage solution.
 */
async function readSecret(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }

  const encrypted = await SecureStore.getItemAsync(key);
  if (!encrypted) return null;

  const decrypted = await decryptData(encrypted);
  return decrypted;
}

async function writeSecret(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);

    return;
  }

  const encrypted = await encryptData(value);
  await SecureStore.setItemAsync(key, encrypted);
}

async function deleteSecret(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);

    return;
  }

  await SecureStore.deleteItemAsync(key);
}

/**
 * Get or generate an AES encryption key for encrypting sensitive data.
 * The key is stored in SecureStore and reused across app sessions.
 */
async function getOrCreateEncryptionKey(): Promise<AESEncryptionKey> {
  try {
    const existingKeyHex = await readSecret(ENCRYPTION_KEY_KEY);
    if (existingKeyHex) {
      return await AESEncryptionKey.import(existingKeyHex, 'hex');
    }
  } catch {
    // If key is corrupted, generate a new one
  }

  const newKey = await AESEncryptionKey.generate(256);
  const keyHex = await newKey.encoded('hex');
  await writeSecret(ENCRYPTION_KEY_KEY, keyHex);
  return newKey;
}

/**
 * Encrypt sensitive data before storing it locally.
 * This ensures that even if the device is compromised, the data is protected.
 *
 * NOTE: This only encrypts local storage. Data transmitted to the API is
 * already protected by HTTPS (TLS encryption at the transport layer).
 */
async function encryptData(plaintext: string): Promise<string> {
  const key = await getOrCreateEncryptionKey();
  const plaintextBase64 = btoa(plaintext);
  const sealedData = await aesEncryptAsync(plaintextBase64, key);
  const encryptedBytes = await sealedData.combined();
  return btoa(String.fromCharCode(...encryptedBytes));
}

/**
 * Decrypt sensitive data that was stored locally.
 */
async function decryptData(encryptedBase64: string): Promise<string | null> {
  try {
    const key = await getOrCreateEncryptionKey();
    const encryptedBytes = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
    const sealedData = AESSealedData.fromCombined(encryptedBytes);
    const decryptedBase64 = await aesDecryptAsync(sealedData, key, { output: 'base64' });
    return atob(decryptedBase64);
  } catch {
    return null;
  }
}

/** Stable token name so sessions are recognisable in the API's token list. */
function deviceName(): string {
  const model = Device.modelName ?? Platform.OS;

  return `${model} (${Platform.OS})`;
}

type AuthContextValue = {
  token: string | null;
  user: ApiUser | null;
  /** `true` until the stored session has been read and validated. */
  isBootstrapping: boolean;
  isSigningIn: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<ApiUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persistSession = useCallback(async (nextToken: string, nextUser: ApiUser) => {
    setToken(nextToken);
    setUser(nextUser);

    await Promise.all([
      writeSecret(TOKEN_KEY, nextToken),
      writeSecret(USER_KEY, JSON.stringify(nextUser)),
    ]);
  }, []);

  const clearSession = useCallback(async () => {
    setToken(null);
    setUser(null);

    await Promise.all([
      deleteSecret(TOKEN_KEY),
      deleteSecret(USER_KEY),
      deleteSecret(ENCRYPTION_KEY_KEY),
    ]);
  }, []);

  // Restore the session on cold start. The token is verified against the API
  // so a revoked token returns the user to the login screen straight away.
  useEffect(() => {
    let isMounted = true;

    const restore = async () => {
      try {
        const storedToken = await readSecret(TOKEN_KEY);

        if (!storedToken) {
          return;
        }

        const response = await auth.currentUser(storedToken);

        if (!isMounted) {
          return;
        }

        await persistSession(storedToken, response.user);
      } catch (restoreError) {
        if (!isMounted) {
          return;
        }

        if (restoreError instanceof ApiError && restoreError.status === 401) {
          await clearSession();
        }
        // Network errors keep the cached session: the driver may be offline
        // and should not be logged out because of it.
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    };

    const readCachedUser = async () => {
      const cached = await readSecret(USER_KEY);

      if (cached && isMounted) {
        setUser(JSON.parse(cached) as ApiUser);
      }
    };

    void readCachedUser();
    void restore();

    return () => {
      isMounted = false;
    };
  }, [clearSession, persistSession]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setIsSigningIn(true);
      setError(null);

      try {
        const response = await auth.issueToken(email.trim(), password, deviceName());

        await persistSession(response.token, response.user);
        router.replace('/');
      } catch (signInError) {
        const message =
          signInError instanceof ApiError
            ? (signInError.fieldError('email') ?? signInError.message)
            : 'Unexpected error while signing in.';

        setError(message);
      } finally {
        setIsSigningIn(false);
      }
    },
    [persistSession],
  );

  const signOut = useCallback(async () => {
    const currentToken = token;

    await clearSession();

    if (currentToken) {
      // Revoking is best-effort: the local session is already gone.
      await auth.revokeToken(currentToken).catch(() => undefined);
    }

    router.replace('/login');
  }, [clearSession, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isBootstrapping,
      isSigningIn,
      error,
      signIn,
      signOut,
      clearError: () => setError(null),
    }),
    [error, isBootstrapping, isSigningIn, signIn, signOut, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }

  return context;
}
