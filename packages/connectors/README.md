# WordPress Connectors

Client library for the WordPress Connectors API. Lets plugins register custom render functions for the Connectors admin screen (`Settings → Connectors`) and declare typed configuration fields that WordPress renders and persists through the Settings REST API.

## Table of Contents

-   [Installation](#installation)
-   [Usage](#usage)
    -   [Register a custom render for a connector](#register-a-custom-render-for-a-connector)
    -   [Let WordPress render typed fields (recommended)](#let-wordpress-render-typed-fields-recommended)
-   [API Reference](#api-reference)
    -   [Exports](#exports)
    -   [Field types](#field-types)
    -   [The `configSchema` entry shape](#the-configschema-entry-shape)
-   [PHP API](#php-api)
-   [Back compatibility](#back-compatibility)
-   [Development](#development)

## Installation

The client ships with WordPress Core as a script module and is automatically registered on the Connectors admin screen. Plugins can depend on `@wordpress/connectors` via its script-module ID:

```php
wp_register_script_module(
    'my-plugin/connector-settings',
    plugins_url( 'assets/js/connector-settings.js', __FILE__ ),
    array(
        array( 'import' => 'static', 'id' => '@wordpress/connectors' ),
    ),
    '1.0.0'
);
wp_enqueue_script_module( 'my-plugin/connector-settings' );
```

## Usage

### Register a custom render for a connector

Useful when a connector needs UI that cannot be expressed as a flat list of fields (OAuth flows, multi-step setup wizards, live token validation).

```tsx
import {
    __experimentalRegisterConnector as registerConnector,
    __experimentalConnectorItem as ConnectorItem,
} from '@wordpress/connectors';

registerConnector( 'my-plugin/local-llm', {
    render: ( { name, description, logo } ) => (
        <ConnectorItem logo={ logo } name={ name } description={ description }>
            <MyCustomSettingsForm />
        </ConnectorItem>
    ),
} );
```

The render receives the server-provided metadata for the connector and is free to fetch and persist its own state — typically through `@wordpress/core-data`'s `useEntityRecord( 'root', 'site' )`, which maps to the Settings REST API.

### Let WordPress render typed fields (recommended)

For most connectors, declaring fields on the PHP side is enough — WordPress renders the form automatically with a single Save button for the connector, inline validation help, env-var / constant source detection, and masking of sensitive values.

PHP:

```php
add_action( 'wp_connectors_init', function () {
    register_connector_field(
        'local-llm',
        'base_url',
        array(
            'control'           => 'url',
            'label'             => __( 'Server URL', 'my-plugin' ),
            'description'       => __( 'Base URL of your local LLM server.', 'my-plugin' ),
            'default'           => 'http://127.0.0.1:1337/v1',
            'sanitize_callback' => 'esc_url_raw',
        )
    );
} );
```

That field appears on the Connectors screen as a URL input with a Save button; no plugin-side JavaScript required. Every field in the connector's `configSchema` is rendered by the shared `DefaultConnectorSettings` component, so a plugin can opt into the custom-render path (above) only when the typed-field surface isn't enough.

## API Reference

### Exports

| Export | Kind | Purpose |
| ------ | ---- | ------- |
| `__experimentalRegisterConnector( slug, config )` | function | Merges render + metadata into the connector store. Subsequent calls for the same slug upsert. |
| `__experimentalUnregisterConnector( slug )` | function | Removes a previously registered connector. |
| `__experimentalConnectorItem` | component | Row shell used on the Connectors admin screen. Pass `logo`, `name`, `description`, and children representing the settings UI. |
| `__experimentalDefaultConnectorSettings` | component | Default settings form. When given a `configSchema`, renders typed controls; otherwise renders the legacy API-key form. |
| `ConnectorConfig`, `ConnectorRenderProps` | types | Props consumed by the admin page render loop. Include optional `configSchema`. |
| `ConnectorField`, `ConnectorFieldType`, `ConnectorFieldControl`, `FieldValueSource` | types | Describe a single configuration field emitted by the PHP Connector Fields API. |
| `__experimentalApiKeySource` | type | Legacy source indicator used by the single-API-key form. |
| `privateApis` | object | Internal store + constants exposed for Gutenberg-owned modules. Not a stable surface. |

### Data type vs. control

A field separates **what it stores** (`type`) from **how it renders** (`control`), mirroring how `register_setting()` types data while leaving presentation to the UI. A field can store a `string` yet render as a `url`, `password`, or `select`.

`ConnectorFieldType` (stored data type, defaults to `string`) is one of: `string`, `boolean`, `integer`, `number`, `array`, `object`.

`ConnectorFieldControl` (UI input, defaults from the data type) maps as follows:

| Control | Rendered as |
| ------- | ----------- |
| `text` | `TextControl` (default for `string`) |
| `url` | `TextControl` with `type="url"` |
| `email` | `TextControl` with `type="email"` |
| `password` | `TextControl` with `type="password"` |
| `number` | `NumberControl` (default for `integer` / `number`) |
| `textarea` | `TextareaControl` |
| `select` | `SelectControl`; `choices` (a `{ value: label }` map) is required |
| `checkbox` | `CheckboxControl` (default for `boolean`) |
| `custom` | Not rendered by the default component — reserved for a future slot-fill API |

### The `configSchema` entry shape

Each entry in `ConnectorRenderProps.configSchema` is a `ConnectorField` produced by the PHP side of the Connectors API. The most relevant fields:

-   `name` — stable field identifier unique within a connector.
-   `type` — the stored data type (one of the `ConnectorFieldType` values).
-   `control` — the UI control to render (one of the `ConnectorFieldControl` values).
-   `label` / `description` / `placeholder` — translatable strings presented to the user.
-   `settingName` — the underlying WordPress option. Custom renders save to this name via the Settings REST API.
-   `value` — current effective value, masked if `sensitive` is true.
-   `source` — `"env" | "constant" | "database" | "default"`. Used to decide whether the input should be read-only.
-   `sensitive` / `readOnly` / `isStored` / `credentialsUrl` / `choices` — render hints.

## PHP API

The client-side API is paired with a PHP field registry shipped by the Gutenberg plugin (`lib/compat/wordpress-7.1/`). See the [Connector Fields API handbook page](https://developer.wordpress.org/plugins/connectors/) for the full reference. Core entry points:

-   `register_connector_field( $connector_id, $field_name, $args )` — declare a typed field.
-   `unregister_connector_field( $connector_id, $field_name )` — remove one.
-   `wp_get_connector_field( $connector_id, $field_name )` / `wp_get_connector_fields( $connector_id )` — read registered metadata.
-   `wp_get_connector_field_value( $connector_id, $field_name )` — resolve the effective value, honouring environment-variable and PHP-constant overrides.

Fields declared via `register_connector_field()` are surfaced to this package through the per-connector `configSchema` key injected into the `script_module_data_options-connectors-wp-admin` filter.

## Back compatibility

Connectors that only declared a legacy `api_key` authentication (the only shape supported before this release) continue to render unchanged. A back-compat shim synthesises an implicit `api_key` field for them at `wp_connectors_init` priority 9999, using the same setting name as before so no database migration is required.

## Development

See the [`@wordpress/packages` guide](https://github.com/WordPress/gutenberg/tree/HEAD/packages) for how to build, test, and publish Gutenberg packages.

Run this package's tests with:

```bash
npm run test:unit packages/connectors
```

Run the matching PHP tests (from a running wp-env):

```bash
npm run test:unit:php -- --filter=Tests_Connector_Field_Registry
```
