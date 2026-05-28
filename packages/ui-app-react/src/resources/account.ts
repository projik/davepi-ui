import type { ResourceConfig } from '@davepi/ui-core';

/**
 * Per-resource override file for the `account` resource.
 *
 * Demonstrates the full override surface:
 *   - explicit list columns (with a labelled `description` column)
 *   - sidebar category grouping
 *   - bulk-delete action via the `__delete__`/`bulkDelete` built-in
 */
const config: ResourceConfig = {
  label: 'Account',
  pluralLabel: 'Accounts',
  category: 'CRM',
  displayField: 'accountName',
  listColumns: [
    { field: 'accountName', label: 'Account name' },
    { field: 'description', label: 'Notes' },
  ],
  actions: {
    bulk: [
      {
        id: 'bulk-delete',
        label: 'Delete selected',
        kind: 'bulkDelete',
      },
    ],
  },
};

export default config;
