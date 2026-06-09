import { describe, it, expect } from 'vitest';
import tailwindConfig from '../tailwind.config';

describe('tailwind.config', () => {
  it('should have popover color defined with DEFAULT and foreground', () => {
    const theme = tailwindConfig.theme as { extend?: { colors?: Record<string, unknown> } };
    const colors = theme?.extend?.colors ?? {};

    expect(colors).toHaveProperty('popover');
    expect(colors.popover).toEqual(
      expect.objectContaining({
        DEFAULT: 'hsl(var(--popover))',
        foreground: 'hsl(var(--popover-foreground))',
      })
    );
  });

  it('should have all required colors defined', () => {
    const theme = tailwindConfig.theme as { extend?: { colors?: Record<string, unknown> } };
    const colors = theme?.extend?.colors ?? {};

    const requiredColors = [
      'border',
      'input',
      'ring',
      'background',
      'foreground',
      'primary',
      'secondary',
      'destructive',
      'muted',
      'accent',
      'card',
      'popover',
    ];

    for (const color of requiredColors) {
      expect(colors).toHaveProperty(color);
    }
  });
});
