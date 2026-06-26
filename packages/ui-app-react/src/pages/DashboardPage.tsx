import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDavepiConfig, useDescribe } from '@davepi/ui-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResourceIcon } from '@/components/ResourceIcon';

/**
 * Default home view. Shows a high-level breakdown of registered resources.
 *
 * Customize via `config.dashboard` (`davepi-ui.config.ts`):
 *   - `title` / `subtitle` — heading copy (`subtitle: ''` hides the default).
 *   - `showResourceCards` — set `false` for a blank canvas to drop your own
 *     widgets onto (just edit this file — it's part of the app template).
 *   - `resourceCards` — explicit list + order of resource paths to card.
 * Resources with `config.resources[path].hidden` never appear here.
 */
export function DashboardPage() {
  const { data, isPending, error } = useDescribe();
  const { config, resolveResource } = useDavepiConfig();
  const dash = config.dashboard ?? {};
  const showCards = dash.showResourceCards ?? true;
  // `subtitle: ''` hides the line; `undefined` falls back to default copy.
  const subtitle =
    dash.subtitle === undefined ? 'Resources discovered from /_describe.' : dash.subtitle;

  const cards = useMemo(() => {
    if (!data || !showCards) return [];
    const all = data.registry.paths();
    const ordered = dash.resourceCards
      ? dash.resourceCards.filter((p) => all.includes(p))
      : all;
    return ordered
      .map((path) => ({ path, cfg: resolveResource(path) }))
      .filter(({ cfg }) => !cfg.hidden);
  }, [data, showCards, dash.resourceCards, resolveResource]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dash.title ?? 'Dashboard'}
        </h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {isPending ? <p>Loading schema…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {showCards && data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ path, cfg }) => {
            const display = data.registry.display(path);
            const entry = data.registry.get(path)!;
            const label = cfg.pluralLabel ?? cfg.label ?? display.pluralLabel;
            return (
              <Link key={path} to={`/r/${path}`} className="block">
                <Card className="transition-colors hover:bg-accent/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ResourceIcon
                        name={cfg.icon}
                        className="size-4 shrink-0 text-muted-foreground"
                      />
                      {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <div>Path: <code>{path}</code></div>
                    <div>Fields: {entry.fields.length}</div>
                    <div>Display field: <code>{display.displayField}</code></div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
