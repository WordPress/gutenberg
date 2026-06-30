<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   `WidgetAttributeField< Item >`: authoring helper narrowing a DataViews
    `Field.id` to the widget's attribute keys.

### Enhancements

-   `WidgetModuleRecord`: add optional `category`, overlaid onto the
    metadata module's value.

## 0.1.0 (2026-06-24)

### New Features

-   Initial experimental release.
-   `<WidgetRender>`: host entry point that resolves a widget's render
    module and mounts it with the `attributes` / `setAttributes` render
    contract.
-   `useWidgetTypes( records )`: data-source-agnostic discovery hook that
    resolves widget types from host-supplied `WidgetModuleRecord[]`.
-   Contract types: `WidgetType`, `WidgetName`, `WidgetIcon`,
    `WidgetRenderProps`, `ResolveWidgetModule`, `WidgetModuleRecord`.
