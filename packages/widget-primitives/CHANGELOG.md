<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Initial experimental release.
-   `<WidgetRender>`: host entry point that resolves a widget's render
    module and mounts it with the `attributes` / `setAttributes` render
    contract.
-   `useWidgetTypes( { kind, name } )`: discovery hook returning the widget
    types from the core-data entity the host registered at `( kind, name )`.
-   Contract types: `WidgetType`, `WidgetName`, `WidgetIcon`,
    `WidgetRenderProps`, `ResolveWidgetModule`, `UseWidgetTypesOptions`.
