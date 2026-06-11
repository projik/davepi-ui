import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { DescribeManifest } from '@davepi/ui-core';
import { AuthProvider } from '../src/auth/index.js';
import { DescribeProvider, useDescribe } from '../src/hooks/index.js';

/**
 * Regression coverage for the "Unknown relation target" failure: widgets that
 * hardcode `useDescribe()` (RelationPicker, MultiRelationPicker, …) came up
 * empty whenever the manifest was fetched outside the standard auth-gated
 * query (e.g. a custom OAuth data layer). `<DescribeProvider>` injects an
 * already-fetched manifest so those consumers resolve it regardless of how
 * the app sourced it.
 */

const manifest: DescribeManifest = {
  service: { name: 'test', version: '1.0.0' },
  auth: {},
  conventions: {},
  graphql: { endpoint: '/graphql', playground: '/playground' },
  schemas: {
    'v1/employee': {
      version: 'v1',
      path: 'employee',
      collection: 'employees',
      fields: [
        { name: '_id', type: 'ObjectId' },
        { name: 'name', type: 'String', required: true },
        { name: 'managerId', type: 'String', reference: 'employee' },
      ],
      features: { softDelete: false, audit: false },
      endpoints: {
        list: '/api/v1/employee',
        create: '/api/v1/employee',
        bulkPut: '/api/v1/employee',
        get: '/api/v1/employee/:id',
        update: '/api/v1/employee/:id',
        delete: '/api/v1/employee/:id',
        schema: '/api/v1/employee/schema',
      },
      graphql: { queries: [], mutations: [] },
    },
  },
};

function Probe() {
  const { data, isPending } = useDescribe();
  if (isPending) return <div data-testid="probe">pending</div>;
  if (!data) return <div data-testid="probe">no-data</div>;
  const entry = data.registry.get('employee');
  return <div data-testid="probe">{entry ? `resolved:${entry.path}` : 'missing'}</div>;
}

function withQueryClient(node: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{node}</QueryClientProvider>;
}

describe('DescribeProvider', () => {
  afterEach(() => cleanup());

  it('serves the injected manifest to useDescribe without an AuthProvider', () => {
    render(
      withQueryClient(
        <DescribeProvider manifest={manifest}>
          <Probe />
        </DescribeProvider>
      )
    );
    expect(screen.getByTestId('probe').textContent).toBe('resolved:employee');
  });

  it('takes precedence over the auth-gated query when both are mounted', () => {
    // AuthProvider is unauthenticated (no refresh token) so the standard
    // query stays disabled/pending — the override must win.
    render(
      withQueryClient(
        <AuthProvider
          baseUrl="http://api.test"
          storage={{ getItem: () => null, setItem: () => {}, removeItem: () => {} }}
        >
          <DescribeProvider manifest={manifest}>
            <Probe />
          </DescribeProvider>
        </AuthProvider>
      )
    );
    expect(screen.getByTestId('probe').textContent).toBe('resolved:employee');
  });

  it('is inert while manifest is undefined (falls back to the standard query)', () => {
    render(
      withQueryClient(
        <AuthProvider
          baseUrl="http://api.test"
          storage={{ getItem: () => null, setItem: () => {}, removeItem: () => {} }}
        >
          <DescribeProvider manifest={undefined}>
            <Probe />
          </DescribeProvider>
        </AuthProvider>
      )
    );
    expect(screen.getByTestId('probe').textContent).toBe('pending');
  });
});
