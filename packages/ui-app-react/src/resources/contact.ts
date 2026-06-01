import type { ResourceConfig } from '@davepi/ui-core';

/**
 * Contact override. Form sections and explicit list columns are the
 * UI-only bits — labels / pluralLabel / displayField come straight
 * from the backend manifest.
 */
const config: ResourceConfig = {
  category: 'CRM',
  listColumns: [
    { field: 'first_name' },
    { field: 'last_name' },
    { field: 'email' },
    { field: 'phone' },
  ],
  formSections: [
    {
      title: 'Identity',
      fields: [{ field: 'first_name' }, { field: 'last_name' }, { field: 'email' }],
    },
    {
      title: 'Contact',
      fields: [{ field: 'phone' }, { field: 'mobile' }, { field: 'company' }],
    },
    {
      title: 'Address',
      description: 'Postal address used for invoices and correspondence.',
      fields: [
        { field: 'address1' },
        { field: 'address2' },
        { field: 'suburb' },
        { field: 'state' },
        { field: 'postcode' },
        { field: 'country' },
      ],
    },
  ],
};

export default config;
