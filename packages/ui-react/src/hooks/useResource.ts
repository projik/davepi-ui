import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider.js';
import type { ListParams, ListResponse } from '../client.js';

/**
 * Resource hooks built on TanStack Query.
 *
 * Every list/get/create/update/delete operation against the davepi REST
 * surface flows through these hooks so cache invalidation stays
 * consistent. The query-key shape is `['davepi','resource',path,kind,...]`
 * which lets a mutation against e.g. `account` invalidate every list/get
 * for that path with a single call.
 *
 * Pass the schema's API version when constructing the resource path;
 * default is `v1`.
 */

export interface UseResourceListOptions {
  version?: string;
  params?: ListParams;
  enabled?: boolean;
}

export function resourcePath(path: string, version = 'v1'): string {
  return `/api/${version}/${path}`;
}

export function useResourceList<T = Record<string, unknown>>(
  path: string,
  opts: UseResourceListOptions = {}
): UseQueryResult<ListResponse<T>> {
  const { client, status } = useAuth();
  const version = opts.version ?? 'v1';
  return useQuery({
    queryKey: ['davepi', 'resource', path, version, 'list', opts.params ?? {}],
    enabled: (opts.enabled ?? true) && status === 'authenticated',
    queryFn: () => client.list<T>(resourcePath(path, version), opts.params),
  });
}

export interface UseResourceOptions {
  version?: string;
  include?: string[];
  enabled?: boolean;
}

export function useResource<T = Record<string, unknown>>(
  path: string,
  id: string | undefined,
  opts: UseResourceOptions = {}
): UseQueryResult<T> {
  const { client, status } = useAuth();
  const version = opts.version ?? 'v1';
  return useQuery({
    queryKey: ['davepi', 'resource', path, version, 'one', id, opts.include ?? []],
    enabled: !!id && (opts.enabled ?? true) && status === 'authenticated',
    queryFn: () => client.get<T>(resourcePath(path, version), id!, opts.include),
  });
}

export interface MutationOptions {
  version?: string;
  /** Extra related-resource paths to invalidate on success. */
  invalidate?: string[];
}

export function useCreateResource<T = Record<string, unknown>>(
  path: string,
  opts: MutationOptions = {}
): UseMutationResult<T, Error, Record<string, unknown>> {
  const { client } = useAuth();
  const qc = useQueryClient();
  const version = opts.version ?? 'v1';
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      client.create<T>(resourcePath(path, version), body),
    onSuccess: () => invalidateRelated(qc, path, opts.invalidate ?? []),
  });
}

export function useUpdateResource<T = Record<string, unknown>>(
  path: string,
  opts: MutationOptions = {}
): UseMutationResult<T, Error, { id: string; body: Record<string, unknown> }> {
  const { client } = useAuth();
  const qc = useQueryClient();
  const version = opts.version ?? 'v1';
  return useMutation({
    mutationFn: ({ id, body }) => client.update<T>(resourcePath(path, version), id, body),
    onSuccess: () => invalidateRelated(qc, path, opts.invalidate ?? []),
  });
}

export function useDeleteResource(
  path: string,
  opts: MutationOptions = {}
): UseMutationResult<{ acknowledged: boolean }, Error, string> {
  const { client } = useAuth();
  const qc = useQueryClient();
  const version = opts.version ?? 'v1';
  return useMutation({
    mutationFn: (id: string) => client.remove(resourcePath(path, version), id),
    onSuccess: () => invalidateRelated(qc, path, opts.invalidate ?? []),
  });
}

function invalidateRelated(
  qc: ReturnType<typeof useQueryClient>,
  primary: string,
  related: string[]
): void {
  qc.invalidateQueries({ queryKey: ['davepi', 'resource', primary] });
  for (const path of related) {
    qc.invalidateQueries({ queryKey: ['davepi', 'resource', path] });
  }
}
