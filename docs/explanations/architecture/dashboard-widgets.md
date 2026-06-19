# The Dashboard Widget System

<div class="callout callout-alert">
The widget system is experimental and ships behind the `gutenberg-dashboard-widgets` experiment. APIs and file conventions may change.
</div>

This document explains how the pieces of the dashboard widget system relate to each other: the authoring convention, the build pipeline, the server-side registry, the client contract published as `@wordpress/widget-primitives`, and the hosts that render widgets.

## Overview

A widget travels through five stations, each owned by a different part of the codebase:

![The widget pipeline: from the widgets folder, through the build and the server registry, to the client package and hosts](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/explanations/architecture/assets/dashboard-widgets-pipeline.svg)

No station knows about the internals of the next one; each consumes a narrow artifact (a folder convention, a manifest, a registry, a REST record, a `WidgetType`). That separation is what lets each piece evolve independently and is the reason the client contract lives in its own package.

## Authoring: a widget is a folder

A widget is a directory under `widgets/`, discovered by convention; there is no registration call to write:

```
widgets/hello-world/
├── widget.json        static metadata (name, title, description, category, presentation)
├── widget.ts          metadata module: default-exports title, icon, attributes, example
├── render.tsx         render module: default-exports the React component
└── style.module.css   optional, injected at runtime by the build
```

The split between `widget.json` and `widget.ts` is deliberate. `widget.json` is build-time input: plain JSON the pipeline can read without executing code. `widget.ts` is the live half of the metadata: values that only exist in JavaScript, such as the icon element or the `attributes` field schema that hosts feed into `DataForm`.

The render component receives the contract props and nothing else:

```tsx
export default function HelloWorld( { attributes, setAttributes } ) { ... }
```

## Build: from folders to script modules

`@wordpress/build` (`packages/wp-build/`) is the generic build tool for packages, routes, and widgets. For widgets specifically, it:

1. Discovers every directory under `widgets/` and reads its `widget.json`.
2. Compiles two ES script modules per widget: `render` (from `render.*`) and `widget` (from `widget.*`), each with an `*.asset.php` carrying module dependencies and a version hash. Missing source files simply produce no module; both are optional.
3. Emits `build/widgets/registry.php`, the manifest: one entry per widget with its directory name, metadata, and which modules were built.
4. Emits `widget-registration.php`, which at `init` calls `wp_register_script_module()` for every built module, with IDs derived from the folder name (`<prefix>/widgets/<dir>/render` and `<prefix>/widgets/<dir>/widget`).

The output of the build is therefore two things: registered script modules (loadable by the browser through the import map) and a manifest (readable by PHP without executing any JavaScript).

## The server registry

`WP_Widget_Type_Registry` (`lib/experimental/dashboard-widgets/`) is a singleton hydrated at `init` from the manifest: each entry becomes a `WP_Widget_Type` with `name`, `render_module`, `widget_module`, and `presentation`. The hydration is a deterministic copy of the manifest, with no filters in between: the `widgets/` folder is the single source of widget authorship in this codebase.

The registry is the server's runtime answer to "which widget types exist on this site", and two consumers read it:

-   The REST controller (`WP_REST_Widget_Modules_Controller`) exposes it at `/wp/v2/widget-modules`, returning `{ name, render_module, widget_module, presentation }` per record.
-   The dashboard page hooks the (otherwise generic) `{page-id}-wp-admin_boot_dependencies` filter to add every registered module to its import map as a `dynamic` dependency: reachable by `import()`, never eagerly executed.

Registration makes the modules known to WordPress; loading them is a separate, per-host decision. Dynamic `import()` against the import map is how the dashboard loads widgets today, but a host can equally enqueue a module eagerly (`wp_enqueue_script_module()`), declare it as a `static` dependency of its own module, or, outside WordPress, skip the import map entirely and resolve modules through its own `ResolveWidgetModule`.

The registry exists as a class (rather than the manifest being read directly by REST) so that the _source_ of widget types stays an implementation detail. Today the only source is the build manifest; a plugin-facing registration API would target the registry without touching the pipeline behind it.

## The client contract: `@wordpress/widget-primitives`

The package is the single source of truth for what a widget _is_ on the client, shared by widget authors and hosts. It exposes three kinds of resources and deliberately nothing else:

-   **Contract types**: `WidgetType`, `WidgetName`, `WidgetIcon`, `WidgetRenderProps`, `ResolveWidgetModule`, `WidgetModuleRecord`. Authors type `widget.ts` / `render.tsx` against them; hosts consume the same shapes. Nothing re-exports them.
-   **Discovery**: `useWidgetTypes( records )` takes host-supplied widget-module records, dynamically imports each record's `widget_module` to retrieve the live metadata, and merges both halves into `WidgetType[]`. The record's `presentation` (originating in `widget.json`) wins over the module's value. The hook reaches for no store or endpoint: the host fetches the records however it wants (the dashboard reads its own `widgetModule` core-data entity, backed by `/wp/v2/widget-modules`) and passes them in.
-   **Rendering**: `<WidgetRender>` resolves a `WidgetType.renderModule` through a host-provided `ResolveWidgetModule` and mounts the component with the `attributes` / `setAttributes` contract. On a WordPress page the resolver can be as simple as `( id ) => import( id )`, provided the hosting page exposed the module in its import map; hosts with other loading strategies supply their own resolver.

Equally important is what the package does not do: no chrome, no layout, no persistence, no data store of its own, and no knowledge of any host. That is what makes it publishable and consumable outside the WordPress admin.

## Hosts

A host is any context that renders widgets; the contract privileges none of them. The dashboard engine ([`@wordpress/widget-dashboard`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/widget-dashboard), mounted by `routes/dashboard/`) is the host this repository ships today, and it illustrates what a host owns: it registers the `widgetModule` core-data entity when its route module loads (before the dashboard renders), reads the entity's records and passes them to `useWidgetTypes( records )`, owns the layout array and its persistence, wraps every instance in its own chrome (header, toolbars, error boundary, Suspense fallback), and passes `resolveWidgetModule` down through its context (overridable for tests and Storybook).

The same `WidgetType` could equally be rendered by a sidebar, a plugin panel, or an application outside wp-admin; the choice of where and how to render belongs entirely to the host. Every host is a consumer of the package; not every consumer is a host: tests, Storybook, or a picker that only lists widget types consume the same contract without rendering anything.

## Why a standalone package

The pipeline above has a natural seam: everything up to the REST endpoint is WordPress infrastructure, and everything after `WidgetType[]` is host territory. The contract in between is small, stable, and needed by both sides, which is exactly the shape of a package:

-   Widget authors depend on it to type their metadata and render components.
-   Hosts depend on it to discover and mount widgets without knowing how they were built or registered.
-   Neither side needs the other's dependencies: the package keeps its own footprint minimal (`element`, plus type-only `dataviews`); discovery is data-source agnostic, so it no longer depends on `core-data`/`data`.
