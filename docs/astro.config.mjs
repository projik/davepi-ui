import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'davepi-ui',
      description: 'Schema-driven, agent-first admin framework for davepi backends.',
      social: { github: 'https://github.com/projik/davepi-ui' },
      sidebar: [
        { label: 'Start here', items: [
          { label: 'Why davepi-ui', slug: 'index' },
          { label: 'Getting started', slug: 'start/getting-started' },
          { label: 'OAuth authentication', slug: 'start/oauth' },
        ]},
        { label: 'Concepts', items: [
          { label: 'Schema-driven model', slug: 'concepts/schema-driven' },
          { label: 'Widget resolution', slug: 'concepts/widgets' },
          { label: 'Relation graph', slug: 'concepts/relations' },
          { label: 'Override layers', slug: 'concepts/overrides' },
          { label: 'ACL & permissions', slug: 'concepts/acl' },
        ]},
        { label: 'Reference', items: [
          { label: 'Config reference', slug: 'reference/config' },
          { label: 'Descriptor JSON', slug: 'reference/descriptors' },
          { label: 'Component manifest', slug: 'reference/components' },
        ]},
        { label: 'Agent integration', items: [
          { label: 'MCP server', slug: 'agents/mcp' },
          { label: 'Recipes', slug: 'agents/recipes' },
          { label: 'Claude Code skill', slug: 'agents/skill' },
        ]},
      ],
    }),
  ],
});
