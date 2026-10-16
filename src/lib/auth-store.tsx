import { ApiError } from '@/lib/api';
import { auth } from '@/lib/endpoints';
import type { ApiUser } from '@/lib/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

/**
 * `expo-secure-store` has no web implementation, so the token falls back to
 * AsyncStorage when the app runs on the web target. Native builds always use
 * the Keychain / Keystore.
 */
async function readSecret(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function writeSecret(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);

    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function deleteSecret(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);

    return;
  }

  await SecureStore.deleteItemAsync(key);
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

    await Promise.all([deleteSecret(TOKEN_KEY), deleteSecret(USER_KEY)]);
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
