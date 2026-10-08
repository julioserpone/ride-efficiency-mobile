import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api';

export type AsyncState<T> = {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  /** `true` while a manual refresh is running and stale data is on screen. */
  isRefreshing: boolean;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
};

type Mode = 'initial' | 'refresh';

/**
 * Loads data once on mount and exposes a manual refresh for pull-to-refresh.
 *
 * Deliberately minimal: the app has a handful of read endpoints and no cache,
 * so a shared fetcher hook beats pulling in a data-fetching library. The loader
 * lives in a ref so callers can pass an inline arrow function without
 * re-fetching on every render, and the whole load is expressed as a state
 * machine driven by an effect: the effect only *describes* the request, the
 * state transition happens in the async resolution. That keeps the hook
 * compliant with the React Compiler's "no setState synchronously in an effect"
 * rule while still running on mount.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: readonly unknown[] = []): AsyncState<T> {
  const loaderRef = useRef(loader);
  const [state, setState] = useState<{
    data: T | null;
    error: string | null;
    isLoading: boolean;
    isRefreshing: boolean;
  }>({ data: null, error: null, isLoading: true, isRefreshing: false });

  useEffect(() => {
    loaderRef.current = loader;
  }, [loader]);

  const run = useCallback(async (mode: Mode) => {
    // Marks the request as in flight and clears the previous error. State is
    // written from this async callback, never synchronously inside an effect.
    setState((current) => ({
      ...current,
      isLoading: mode === 'initial',
      isRefreshing: mode === 'refresh',
      error: null,
    }));

    try {
      const data = await loaderRef.current();

      setState({ data, error: null, isLoading: false, isRefreshing: false });
    } catch (loadError) {
      setState((current) => ({
        ...current,
        error:
          loadError instanceof ApiError ? loadError.message : 'Something went wrong. Try again.',
        isLoading: false,
        isRefreshing: false,
      }));
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      try {
        const data = await loaderRef.current();

        if (!isCancelled) {
          setState({ data, error: null, isLoading: false, isRefreshing: false });
        }
      } catch (loadError) {
        if (!isCancelled) {
          setState({
            data: null,
            error:
              loadError instanceof ApiError
                ? loadError.message
                : 'Something went wrong. Try again.',
            isLoading: false,
            isRefreshing: false,
          });
        }
      }
    };

    void load();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    ...state,
    reload: () => run('initial'),
    refresh: () => run('refresh'),
  };
}
