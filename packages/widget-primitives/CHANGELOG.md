<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   `WidgetAttributeField< Item >`: authoring helper narrowing a DataViews
    `Field.id` to the widget's attribute keys.

### Enhancements

-   Widen React peer dependency ranges to `^18 || ^19` to support both React 18 and React 19 environments ([#80024](https://github.com/WordPress/gutenberg/pull/80024)).
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

### Documentation

-   Add a widget anatomy doc and lighten the widget system doc.
-   Document the `relevance` hint and `help` note across anatomy, authoring,
    and architecture docs; add an attribute-relevance diagram.
-   Add a `WithRelevance` Storybook story for attribute relevance hints.

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
