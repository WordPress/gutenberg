<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   `DefaultConnectorSettings` now accepts an optional `configSchema` prop and
    renders one typed control per declared field with a single Save button for
    the whole connector (all changed fields persist together). Each
    field separates its stored data `type` (`string`, `boolean`, `integer`,
    `number`, `array`, `object` — matching `register_setting()`) from its UI
    `control` (`text`, `url`, `email`, `password`, `number`, `textarea`,
    `select`, `checkbox`, and a `custom` placeholder for future slot-fill
    integration). When `configSchema` is omitted, the component falls back to
    the legacy single-API-key form so existing consumers keep working.
-   New public TypeScript types: `ConnectorField`, `ConnectorFieldType` (data
    type), `ConnectorFieldControl` (UI control), `FieldValueSource`.
-   `ConnectorConfig` and `ConnectorRenderProps` gain an optional
    `configSchema` field carrying the per-connector field list from the
    Connectors script-module-data payload.

### Code Quality

-   Add missing `@types/react` dependency. [#78882](https://github.com/WordPress/gutenberg/pull/78882).

## 1.0.0 (Unreleased)

### New Features

-   Initial release of the WordPress Connectors client library.
