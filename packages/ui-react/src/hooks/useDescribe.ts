import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchDescribe, SchemaRegistry, type DescribeManifest } from '@davepi/ui-core';
import { useAuth } from '../auth/AuthProvider.js';

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
  const { baseUrl, client, status } = useAuth();
  return useQuery({
    queryKey: ['davepi', 'describe', baseUrl],
    enabled: status === 'authenticated',
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    queryFn: () => client.fetchJson<DescribeManifest>('/_describe'),
    select: toData,
  });
}

/**
 * Unauthenticated variant useful for displaying the login page without
 * requiring a token first. Reads `/_describe` only when the backend has
 * `DESCRIBE_REQUIRES_AUTH=false`; otherwise the call 401s and the hook
 * returns an error.
 */
export function useAnonymousDescribe(): UseQueryResult<UseDescribeData> {
  const { baseUrl } = useAuth();
  return useQuery({
    queryKey: ['davepi', 'describe-anon', baseUrl],
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: () => fetchDescribe({ baseUrl }),
    select: toData,
  });
}
