import type { ResourceConfig } from '@davepi/ui-core';

/**
 * Per-resource override for `contact`. Shows form sectioning + a
 * configured display field.
 */
const config: ResourceConfig = {
  label: 'Contact',
  pluralLabel: 'Contacts',
  category: 'CRM',
  displayField: 'first_name',
  listColumns: [
    { field: 'first_name', label: 'First name' },
    { field: 'last_name', label: 'Last name' },
    { field: 'email', label: 'Email' },
    { field: 'phone', label: 'Phone' },
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
