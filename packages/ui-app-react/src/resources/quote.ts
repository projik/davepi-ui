import type { ResourceConfig } from '@davepi/ui-core';

/**
 * Quote override. Only the sidebar category is consumer-supplied —
 * everything else (labels, displayField, contactId relation, etc.)
 * comes from the backend manifest.
 */
const config: ResourceConfig = {
  category: 'CRM',
};

export default config;
