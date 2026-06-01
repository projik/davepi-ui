---
title: Widget resolution
description: How /_describe fields map to React widgets.
---

`resolveWidget(field, ctx)` maps a describe field to a `WidgetKind`. The `widgetRegistry` in `@davepi/ui-app-react` maps each kind to a React component.

## Default mapping

| Describe shape | Widget |
|---|---|
| `String` | `TextInput` (`TextArea` when name matches `/description|notes|body/`) |
| `String` + `enum` | `EnumSelect` |
| `String` + `reference` or `*Id` with target registered | `RelationPicker` |
| `[String]` with relation target | `MultiRelationPicker` |
| `[String]` without target | `TagInput` |
| `Number` | `NumberInput` (`CurrencyInput` with `format: currency:XYZ`) |
| `Boolean` | `Switch` |
| `Date` | `DateInput` |
| `File` | `FileUploader` |
| `Mixed` / `object` | `JsonEditor` |

Email-style names (`*email*`) → `EmailInput`. URL-style names (`*url*`, `*link*`) → `UrlInput`. Backend `widget: 'rich-text'` hint → `RichTextEditor`.

## Override merge order

From lowest precedence to highest:

1. Built-in default per type.
2. Backend hint (`field.widget`, `field.format`).
3. App-wide `config.widgets` glob map (`{ '*.email': 'EmailInput' }`).
4. Per-resource override (`widgets` key on the resource config).
5. Inline `<ResourceForm widgets={{ email: MyWidget }}>` prop.

## Adding a widget

1. Implement a component receiving `WidgetComponentProps<T>`.
2. Register under a new `WidgetKind` in `src/widgets/registry.ts`.
3. Dispatch via `field.widget` hint or `widgets` config override.
