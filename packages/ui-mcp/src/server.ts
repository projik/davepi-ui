/**
 * davepi-ui MCP server.
 *
 * Exposes the component manifest, descriptor JSON schemas, recipes, and
 * (when a `DAVEPI_API_URL` is configured) a live resource graph fetched
 * from the running davepi backend. Tools:
 *
 *   - list_components(): names + categories of every published component
 *   - describe_component({ name }): full manifest entry with props + examples
 *   - list_recipes(): curated patterns the agent can lift directly
 *   - validate_page_spec({ spec }): runs the JSON spec through PageSpec.parse
 *   - list_resources(): when DAVEPI_API_URL is set, lists the live resource
 *     paths + display labels + relation graph derived from /_describe
 *
 * Transport: stdio. Configure in `.mcp.json`:
 *   {
 *     "davepi-ui": {
 *       "command": "node",
 *       "args": ["./node_modules/@davepi/ui-mcp/dist/server.js"],
 *       "env": { "DAVEPI_API_URL": "http://localhost:4001" }
 *     }
 *   }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import {
  componentManifest,
  fetchDescribe,
  getComponent,
  recipes,
  SchemaRegistry,
} from '@davepi/ui-core';
import { PageSpec } from '@davepi/ui-core/descriptor';

const API_URL = process.env.DAVEPI_API_URL?.replace(/\/+$/, '');
const API_TOKEN = process.env.DAVEPI_API_TOKEN;

const server = new Server(
  { name: 'davepi-ui-mcp', version: '0.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'list_components',
      description:
        'List every davepi-ui component published in @davepi/ui-react / @davepi/ui-app-react. Returns name + category + one-line description per entry.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'describe_component',
      description:
        'Fetch the full manifest entry for a component — props schema, usage examples (declarative spec + JSX), and agent notes.',
      inputSchema: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
        additionalProperties: false,
      },
    },
    {
      name: 'list_recipes',
      description:
        'Curated patterns combining multiple components (lists, detail-with-children, pre-stamped create). Each recipe is a JSON spec template.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'validate_page_spec',
      description:
        'Validate a JSON page descriptor against the PageSpec schema. Returns parsed value or a structured error so the agent can iterate.',
      inputSchema: {
        type: 'object',
        properties: { spec: { type: 'object', additionalProperties: true } },
        required: ['spec'],
        additionalProperties: false,
      },
    },
    {
      name: 'list_resources',
      description:
        'List live resource paths from the davepi backend (requires DAVEPI_API_URL). Returns display labels, displayField, and an inferred relation graph including synthetic inverses.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
  ],
}));

const DescribeArgs = z.object({ name: z.string() });
const ValidateArgs = z.object({ spec: z.record(z.unknown()) });

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: rawArgs } = request.params;

  switch (name) {
    case 'list_components':
      return jsonReply(
        componentManifest.map((c) => ({
          name: c.name,
          category: c.category,
          package: c.package,
          description: c.description,
        }))
      );

    case 'describe_component': {
      const { name: target } = DescribeArgs.parse(rawArgs);
      const entry = getComponent(target);
      if (!entry) return errorReply(`Unknown component: ${target}`);
      return jsonReply(entry);
    }

    case 'list_recipes':
      return jsonReply(recipes);

    case 'validate_page_spec': {
      const { spec } = ValidateArgs.parse(rawArgs);
      const parsed = PageSpec.safeParse(spec);
      if (parsed.success) return jsonReply({ ok: true, spec: parsed.data });
      return jsonReply({ ok: false, issues: parsed.error.issues });
    }

    case 'list_resources': {
      if (!API_URL) {
        return errorReply(
          'DAVEPI_API_URL is not set; cannot fetch live schema. Set it in the MCP server env.'
        );
      }
      try {
        const manifest = await fetchDescribe({
          baseUrl: API_URL,
          getToken: () => API_TOKEN,
        });
        const registry = new SchemaRegistry(manifest);
        const paths = registry.paths();
        const resources = paths.map((p) => ({
          path: p,
          ...registry.display(p),
          relations: registry.relations(p),
        }));
        return jsonReply({ apiUrl: API_URL, resources });
      } catch (err) {
        return errorReply(err instanceof Error ? err.message : 'fetchDescribe failed');
      }
    }

    default:
      return errorReply(`Unknown tool: ${name}`);
  }
});

function jsonReply(payload: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
  };
}

function errorReply(message: string) {
  return {
    isError: true,
    content: [{ type: 'text' as const, text: message }],
  };
}

const transport = new StdioServerTransport();
await server.connect(transport);
