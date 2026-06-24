# Widget Primitives

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

The host-agnostic toolkit for dashboard widgets. It is the single source of truth for what a widget _is_ on the client: the contract that widget authors write against and that every host renders, with nothing in between that belongs to one host more than another.

A _host_ is any context that renders widgets: a dashboard, a sidebar, a plugin panel, an application outside wp-admin. The package privileges none of them. It carries the contract and the runtime that resolves it, and stops there.

## What it exposes

Three kinds of resources, and deliberately nothing else.

**Contract types** describe what a widget is: `WidgetType`, `WidgetName`, `WidgetIcon`, `WidgetRenderProps`, `ResolveWidgetModule`, `WidgetModuleRecord`. They are the shapes a host reads to discover and render a widget; how a widget is authored (its folder, `widget.json`, `widget.ts`, `render.tsx`) is covered by **System Architecture**.

**Discovery** is `useWidgetTypes( records )`. It takes host-supplied widget-module records, imports each record's metadata module, and returns the resolved `WidgetType[]` plus a flag that is `true` while they are still resolving, as a `[ WidgetType[], isResolving ]` tuple. The hook reaches for no store or endpoint: the host fetches the records however it wants and passes them in.

**Rendering** is `<WidgetRender>`. It resolves a `WidgetType.renderModule` through a host-provided `ResolveWidgetModule` and mounts the component with the `attributes` / `setAttributes` contract. Suspense, error handling, and chrome stay with the host.

## What it does not do

No chrome, no layout, no persistence, no data store of its own, no knowledge of any host. Those are host concerns. Keeping them out is what makes the package publishable and consumable outside the WordPress admin.

## Where to go next

-   **Anatomy** breaks down everything a widget declares, layer by layer, and why each property lives where it does.
-   **System Architecture** zooms out to the full dashboard widget pipeline, from the `widgets/` folder through the build and the server registry, and shows where this package sits in it.
