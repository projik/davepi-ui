import type { Meta, StoryObj } from '@storybook/react';
import { labelize, pluralize } from '@davepi/ui-core';

const meta: Meta = {
  title: 'core/labelize',
};
export default meta;

interface RowProps {
  raw: string;
  options?: { stripIdSuffix?: boolean };
}

function Row({ raw, options }: RowProps) {
  return (
    <tr>
      <td style={{ padding: '6px 12px', fontFamily: 'monospace' }}>{raw}</td>
      <td style={{ padding: '6px 12px' }}>{labelize(raw, options)}</td>
      <td style={{ padding: '6px 12px' }}>{pluralize(labelize(raw, options))}</td>
    </tr>
  );
}

export const Examples: StoryObj = {
  render: () => (
    <div style={{ padding: 24, color: '#fff', fontFamily: 'system-ui' }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>labelize() rules</h2>
      <table style={{ borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#171717' }}>
            <th style={{ padding: '6px 12px', textAlign: 'left' }}>input</th>
            <th style={{ padding: '6px 12px', textAlign: 'left' }}>label</th>
            <th style={{ padding: '6px 12px', textAlign: 'left' }}>plural</th>
          </tr>
        </thead>
        <tbody>
          <Row raw="firstName" />
          <Row raw="accountId" options={{ stripIdSuffix: true }} />
          <Row raw="api_key_url" />
          <Row raw="XMLHttpRequest" />
          <Row raw="city" />
          <Row raw="company" />
        </tbody>
      </table>
    </div>
  ),
};
