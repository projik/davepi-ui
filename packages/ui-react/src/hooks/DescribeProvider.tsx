import { createContext, useContext, useMemo, type ReactElement, type ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { SchemaRegistry, type DescribeManifest } from '@davepi/ui-core';
import type { UseDescribeData } from './useDescribe.js';

/**
 * Inject an already-fetched `/_describe` manifest so every `useDescribe()`
 * consumer below — `ResourceForm`, `RelationPicker`, `Sidebar`, … — reads it
 * instead of fetching through the `AuthProvider` client.
 *
 * This is the escape hatch for apps that obtain the manifest out of band:
 * a custom OAuth data layer, server-side preloading, tests, or storybooks.
 * Without it, deeply nested widgets that hardcode `useDescribe()` come up
 * empty whenever the standard auth-gated query isn't the source of truth
 * (e.g. "Unknown relation target" from `RelationPicker` in OAuth mode).
 *
 * @example
 * const { data: manifest } = useMyOAuthDescribeQuery();
 * return (
 *   <DescribeProvider manifest={manifest}>
 *     <ResourceForm resourcePath="employee" onSubmit={save} />
 *   </DescribeProvider>
 * );
 */
export interface DescribeProviderProps {
  /**
   * The raw `/_describe` manifest. While `undefined` (still loading), the
   * provider is inert and `useDescribe()` falls back to its normal
   * auth-gated fetch.
   */
  manifest: DescribeManifest | undefined;
  children: ReactNode;
}

const DescribeOverrideContext = createContext<UseQueryResult<UseDescribeData> | null>(null);

export function DescribeProvider({ manifest, children }: DescribeProviderProps): ReactElement {
  const value = useMemo(() => {
    if (!manifest) return null;
    return successResult({ manifest, registry: new SchemaRegistry(manifest) });
  }, [manifest]);
  return (
    <DescribeOverrideContext.Provider value={value}>{children}</DescribeOverrideContext.Provider>
  );
}

/** @internal Read the injected describe result, if any. */
export function useDescribeOverride(): UseQueryResult<UseDescribeData> | null {
  return useContext(DescribeOverrideContext);
}

/**
 * Shape a static value as a settled-successful `UseQueryResult` so override
 * consumers see the exact same surface (`data`, `isPending`, …) as the
 * real query.
 */
function successResult(data: UseDescribeData): UseQueryResult<UseDescribeData> {
  const result = {
    data,
    dataUpdatedAt: Date.now(),
    error: null,
    errorUpdatedAt: 0,
    errorUpdateCount: 0,
    failureCount: 0,
    failureReason: null,
    fetchStatus: 'idle',
    isError: false,
    isFetched: true,
    isFetchedAfterMount: true,
    isFetching: false,
    isInitialLoading: false,
    isLoading: false,
    isLoadingError: false,
    isPaused: false,
    isPending: false,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isSuccess: true,
    status: 'success',
    refetch: async () => result,
    promise: Promise.resolve(data),
  };
  return result as unknown as UseQueryResult<UseDescribeData>;
}
