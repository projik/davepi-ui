import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchDescribe, SchemaRegistry, type DescribeManifest } from '@davepi/ui-core';
import { useOptionalAuth } from '../auth/AuthProvider.js';
import { useDescribeOverride } from './DescribeProvider.js';

/**
 * Fetch and cache `/_describe` for the lifetime of the session.
 *
 * The manifest changes only when the backend redeploys or hot-reloads a
 * schema, so we treat it as effectively static (`staleTime: Infinity`).
 * Refetch on focus is disabled — too noisy for what is essentially a
 * boot-time blob. Force a refetch with `queryClient.invalidateQueries(['davepi','describe'])`
 * if you need to.
 *
 * Returns both the raw manifest and a memoised `SchemaRegistry` (the
 * widget resolver / label generator / relation graph consume the latter).
 *
 * When an ancestor `<DescribeProvider manifest={…}>` has injected a manifest
 * (e.g. one fetched through a custom OAuth data layer), that takes
 * precedence and no network fetch happens — so schema-driven widgets like
 * `RelationPicker` work no matter how the app sourced the manifest.
 *
 * @example
 * const { data, isPending } = useDescribe();
 * if (isPending) return <Spinner />;
 * console.log(data.registry.paths());
 */
export interface UseDescribeData {
  manifest: DescribeManifest;
  registry: SchemaRegistry;
}

function toData(manifest: DescribeManifest): UseDescribeData {
  return { manifest, registry: new SchemaRegistry(manifest) };
}

export function useDescribe(): UseQueryResult<UseDescribeData> {
  const override = useDescribeOverride();
  const auth = useOptionalAuth();
  if (!auth && !override) {
    throw new Error('useDescribe must be used inside <AuthProvider> or <DescribeProvider>');
  }
  const query = useQuery({
    queryKey: ['davepi', 'describe', auth?.baseUrl ?? '__no-auth__'],
    enabled: !override && auth?.status === 'authenticated',
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: () => {
      if (!auth) throw new Error('useDescribe: no AuthProvider client available');
      return auth.client.fetchJson<DescribeManifest>('/_describe');
    },
    select: toData,
  });
  return override ?? query;
}

/**
 * Unauthenticated variant useful for displaying the login page without
 * requiring a token first. Reads `/_describe` only when the backend has
 * `DESCRIBE_REQUIRES_AUTH=false`; otherwise the call 401s and the hook
 * returns an error.
 */
export function useAnonymousDescribe(): UseQueryResult<UseDescribeData> {
  const override = useDescribeOverride();
  const auth = useOptionalAuth();
  if (!auth && !override) {
    throw new Error(
      'useAnonymousDescribe must be used inside <AuthProvider> or <DescribeProvider>'
    );
  }
  const baseUrl = auth?.baseUrl;
  const query = useQuery({
    queryKey: ['davepi', 'describe-anon', baseUrl ?? '__no-auth__'],
    enabled: !override && !!baseUrl,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: () => fetchDescribe({ baseUrl: baseUrl! }),
    select: toData,
  });
  return override ?? query;
}
