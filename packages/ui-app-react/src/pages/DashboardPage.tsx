import { useDescribe } from '@davepi/ui-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Default home view. Shows a high-level breakdown of registered resources.
 * Consumers swap this out via the per-resource override layer (M3).
 */
export function DashboardPage() {
  const { data, isPending, error } = useDescribe();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resources discovered from <code>/_describe</code>.
        </p>
      </div>
      {isPending ? <p>Loading schema…</p> : null}
      {error ? <p className="text-destructive">{error.message}</p> : null}
      {data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.registry.paths().map((p) => {
            const display = data.registry.display(p);
            const entry = data.registry.get(p)!;
            return (
              <Card key={p}>
                <CardHeader>
                  <CardTitle>{display.pluralLabel}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <div>Path: <code>{p}</code></div>
                  <div>Fields: {entry.fields.length}</div>
                  <div>Display field: <code>{display.displayField}</code></div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
