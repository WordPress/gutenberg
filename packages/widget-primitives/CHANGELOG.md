<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   `WidgetAttributeField< Item >`: authoring helper narrowing a DataViews
    `Field.id` to the widget's attribute keys.

### Enhancements

-   `WidgetAttributeField`: add optional `relevance` hint (`'high' | 'low'`)
    marking attributes a host may promote to a prominent surface.
-   `WidgetModuleRecord`: add optional `category`, overlaid onto the
    metadata module's value.
-   `WidgetModuleRecord`: add optional `title`, `description`, and
    `keywords`, overlaid onto the metadata module's values. Lets a host
    supply metadata translated server-side.
-   `WidgetTypeMetadata`: add optional `help`, a declarative contextual
    note (`content` plus optional `links`) for compact surfaces such as
    tooltips. Also carried by `WidgetModuleRecord`, overlaid onto the
    metadata module's value.

## 0.2.0 (2026-07-01)

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
