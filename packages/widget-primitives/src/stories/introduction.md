# Widget Primitives

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

The host-agnostic toolkit for widgets. It is the single source of truth for what a widget _is_ on the client: the contract that widget authors write against and that every host renders. Nothing host-specific sits in between.

A _host_ is any context that renders widgets: a dashboard, a sidebar, a plugin panel, an application outside wp-admin. The package privileges none of them. It defines the contract and provides the runtime that turns host records into rendered widgets.

## What it exposes

**Contract types** describe what a widget is: `WidgetType`, `WidgetName`, `WidgetIcon`, `WidgetRenderProps`, `ResolveWidgetModule`, `WidgetModuleRecord`. They are the shapes a host reads to discover and render a widget, defined here and re-exported nowhere else. How a widget is authored (its folder, `widget.json`, `widget.ts`, `render.tsx`) is covered by **System Architecture**.

**Discovery** is `useWidgetTypes( records )`. It takes host-supplied widget-module records, imports each record's metadata module, and returns a `[ WidgetType[], isResolving ]` tuple, where `isResolving` is `true` while the records are still being imported. The hook reaches for no store or endpoint: the host fetches the records however it wants and passes them in.

**Rendering** is `<WidgetRender />`. It resolves a `WidgetType.renderModule` through a host-provided `ResolveWidgetModule` and mounts the component with the `attributes` / `setAttributes` contract. Error handling and chrome stay with the host, and because the module is mounted lazily, the host must wrap it in a Suspense boundary.

## What it does not do

No chrome, no layout, no persistence, no data store of its own, no knowledge of any host. Those are host concerns. Keeping them out is what makes the package publishable and consumable outside the WordPress admin.
