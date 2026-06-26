import type { ComponentType } from 'react';
import { icons, type LucideProps } from 'lucide-react';

/**
 * Renders a resource icon from its `config.icon` string.
 *
 * Resolution: normalize the name to PascalCase and look it up in lucide's
 * icon set (`'users'`, `'shopping-cart'`, `'ShoppingCart'` all resolve). If
 * nothing matches, fall back to rendering the raw string — so an emoji or
 * any literal glyph (`'📦'`) just works.
 */
export function ResourceIcon({
  name,
  className,
  ...props
}: { name?: string; className?: string } & Omit<LucideProps, 'ref'>) {
  if (!name) return null;
  const Lucide = (icons as Record<string, ComponentType<LucideProps>>)[
    toPascalCase(name)
  ];
  if (Lucide) return <Lucide className={className} {...props} />;
  return (
    <span className={className} aria-hidden>
      {name}
    </span>
  );
}

/** `shopping-cart` / `shopping_cart` / `shopping cart` / `ShoppingCart` → `ShoppingCart`. */
function toPascalCase(name: string): string {
  return name
    .trim()
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
