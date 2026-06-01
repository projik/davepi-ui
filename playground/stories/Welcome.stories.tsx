import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Welcome',
};
export default meta;

export const Intro: StoryObj = {
  render: () => (
    <div style={{ padding: 24, color: '#fff', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600 }}>davepi-ui playground</h1>
      <p style={{ marginTop: 12, color: '#a3a3a3', maxWidth: 540 }}>
        Storybook for schema-driven davepi-ui components. Pages auto-discovered
        from <code>packages/ui-app-react/src/**/*.stories.tsx</code> and from
        the local <code>stories/</code> directory.
      </p>
      <p style={{ marginTop: 12, color: '#a3a3a3' }}>
        Component category sections in the sidebar (data, field, layout,
        action, auth, config) mirror the manifest entries in <code>@davepi/ui-core</code>.
      </p>
    </div>
  ),
};
