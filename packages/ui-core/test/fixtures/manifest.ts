import type { DescribeManifest } from '../../src/describe/types.js';

/**
 * Minimal manifest fixture shaped like a real davepi M0.5 backend response:
 *
 *   - `account` (parent, hint-rich) — receives the synthetic inverse
 *     `hasMany: deal` because `deal` declares `belongsTo: account`.
 *     The backend stamps `inverse: true` on the synthetic edge.
 *   - `contact` (no relations block, `accountId` field marked `stamped`)
 *     — accountId is the tenant marker on davepi seed schemas, NOT a
 *     parent FK. With no `belongsTo`, the backend does NOT synthesise
 *     an inverse anywhere; the UI hides the field from create / edit forms.
 *   - `deal` — explicit `belongsTo: account`, plus an enum + currency
 *     hint to cover field-hint passthrough.
 */
export const manifest: DescribeManifest = {
  service: { name: 'test', version: '0.0.0' },
  auth: { login: 'POST /login', refresh: 'POST /auth/refresh' },
  conventions: {},
  graphql: { endpoint: 'POST /graphql/', playground: 'GET /graphql/' },
  schemas: {
    'v1/account': {
      version: 'v1',
      path: '/api/v1/account',
      collection: 'account',
      label: 'Account',
      pluralLabel: 'Accounts',
      displayField: 'accountName',
      fields: [
        { name: 'userId', type: 'String', required: true, stamped: true },
        { name: 'accountName', type: 'String', required: true, searchable: true },
        { name: 'description', type: 'String' },
        { name: 'website', type: 'String' },
      ],
      // Backend M0.5 auto-populates the inverse from deal.belongsTo: account.
      relations: {
        deals: { kind: 'hasMany', target: 'deal', foreignKey: 'accountId', inverse: true },
      },
      features: { softDelete: true, audit: true, search: ['accountName'] },
      endpoints: {
        list: 'GET    /api/v1/account',
        create: 'POST   /api/v1/account',
        bulkPut: 'PUT    /api/v1/account',
        get: 'GET    /api/v1/account/:id',
        update: 'PUT    /api/v1/account/:id',
        delete: 'DELETE /api/v1/account/:id',
        schema: 'GET    /api/v1/account-schema',
      },
      graphql: {
        queries: ['accountById', 'accountMany'],
        mutations: ['accountCreateOne', 'accountUpdateById'],
      },
    },
    'v1/contact': {
      version: 'v1',
      path: '/api/v1/contact',
      collection: 'contact',
      fields: [
        { name: 'userId', type: 'String', required: true, stamped: true },
        { name: 'accountId', type: 'String', required: true, stamped: true },
        { name: 'first_name', type: 'String', required: true, searchable: true },
        { name: 'last_name', type: 'String', required: true },
        { name: 'email', type: 'String' },
        { name: 'notes', type: 'String' },
      ],
      features: { softDelete: true, audit: true, search: ['first_name', 'last_name'] },
      endpoints: {
        list: 'GET    /api/v1/contact',
        create: 'POST   /api/v1/contact',
        bulkPut: 'PUT    /api/v1/contact',
        get: 'GET    /api/v1/contact/:id',
        update: 'PUT    /api/v1/contact/:id',
        delete: 'DELETE /api/v1/contact/:id',
        schema: 'GET    /api/v1/contact-schema',
      },
      graphql: { queries: [], mutations: [] },
    },
    'v1/deal': {
      version: 'v1',
      path: '/api/v1/deal',
      collection: 'deal',
      displayField: 'name',
      fields: [
        { name: 'userId', type: 'String', required: true, stamped: true },
        { name: 'accountId', type: 'String', required: true, reference: 'account' },
        { name: 'name', type: 'String', required: true, searchable: true },
        { name: 'stage', type: 'String', enum: ['lead', 'qualified', 'won', 'lost'] },
        { name: 'amount', type: 'Number', widget: 'currency', format: 'currency:USD' },
        { name: 'closeDate', type: 'Date' },
        { name: 'tags', type: '[String]' },
      ],
      relations: {
        account: { kind: 'belongsTo', target: 'account', localKey: 'accountId' },
      },
      features: { softDelete: true, audit: true, search: ['name'] },
      endpoints: {
        list: 'GET    /api/v1/deal',
        create: 'POST   /api/v1/deal',
        bulkPut: 'PUT    /api/v1/deal',
        get: 'GET    /api/v1/deal/:id',
        update: 'PUT    /api/v1/deal/:id',
        delete: 'DELETE /api/v1/deal/:id',
        schema: 'GET    /api/v1/deal-schema',
      },
      graphql: { queries: [], mutations: [], relations: ['deal.account'] },
    },
  },
};
