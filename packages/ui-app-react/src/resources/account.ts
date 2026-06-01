import type { ResourceConfig } from '@davepi/ui-core';

/**
 * Account override. Backend (`/_describe`) supplies label / pluralLabel
 * / displayField, so this file only carries the bits the backend can't
 * know about: sidebar category, table columns, bulk actions.
 */
const config: ResourceConfig = {
  category: 'CRM',
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
