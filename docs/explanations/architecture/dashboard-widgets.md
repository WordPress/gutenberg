# The Dashboard Widget System

<div class="callout callout-alert">
The widget system is experimental and ships behind the `gutenberg-dashboard-widgets` experiment. APIs and file conventions may change.
</div>

This document explains how the pieces of the dashboard widget system relate to each other: the authoring convention, the build pipeline, the server-side registry, the client contract published as `@wordpress/widget-primitives`, and the hosts that render widgets.

## Overview

A widget passes through several stages, each owned by a different part of the codebase:

![The widget pipeline: from the widgets folder, through the build and the server registry, to the client package and hosts](https://developer.wordpress.org/files/2026/06/dashboard-widgets-pipeline.png)

Each stage hands the next a single artifact and nothing else: a folder convention, then the build manifest (`build/widgets/registry.php`), then the in-memory registry (`WP_Widget_Type_Registry`), then a REST record, then a `WidgetType`. No stage reaches into how another works.

That separation lets each stage evolve independently. It is also why the client contract lives in its own package.

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

Its render component receives the widget's `attributes` and, optionally, `setAttributes`:

```tsx
export default function HelloWorld( { attributes } ) { ... }
```

## Build: from folders to script modules

`@wordpress/build` (`packages/wp-build/`) is the generic build tool for packages, routes, and widgets. For widgets specifically, it:

1. Discovers every directory under `widgets/` and reads its `widget.json`.
2. Compiles up to two ES script modules per widget: `render` (from `render.*`) and `widget` (from `widget.*`). Either may be absent; a missing source file produces no module. Each compiled module ships an `*.asset.php` listing its module dependencies and a cache-busting version.
3. Emits `build/widgets/registry.php`, the manifest: one entry per widget with its directory name, metadata, and which modules were built.
4. Emits `build/widgets.php`, which at `init` calls `wp_register_script_module()` for every built module, with IDs derived from the folder name (`<prefix>/widgets/<dir>/render` and `<prefix>/widgets/<dir>/widget`).

## The server registry

`WP_Widget_Type_Registry` (`lib/experimental/dashboard-widgets/`) is a singleton, hydrated at `init` from the manifest. Each entry becomes a `WP_Widget_Type` with `name`, `render_module`, `widget_module`, `presentation`, and `category`.

The hydration is a deterministic copy, with no filters in between. The `widgets/` folder is the single source of widget authorship in this codebase.

The registry is the server's authoritative list of widget types for the site. Two consumers read it:

-   The REST controller (`WP_REST_Widget_Modules_Controller`) exposes it at `/wp/v2/widget-modules`, returning `{ name, render_module, widget_module, presentation, category }` per record.
-   The dashboard page hooks its `dashboard-wp-admin_boot_dependencies` filter, a per-page instance of the generic `{page-slug}-wp-admin_boot_dependencies`, and adds every registered module to its import map as a `dynamic` dependency. A dynamic dependency is reachable by `import()` but never executed eagerly.

Registration only makes the modules known to WordPress; loading them is a separate, per-host decision. Dynamic `import()` against the import map is how the dashboard loads widgets today. A host can load them another way: enqueue a module eagerly (`wp_enqueue_script_module()`), declare it as a `static` dependency of its own module, or, outside WordPress, skip the import map and resolve modules through its own `ResolveWidgetModule`.

The registry exists as a class, rather than having REST read the manifest directly, so the _source_ of widget types stays an implementation detail. Today that source is only the build manifest. A future source, such as a plugin-facing registration API, would target the registry without touching the build pipeline.

## The client contract: `@wordpress/widget-primitives`

Everything after the REST record is the job of [`@wordpress/widget-primitives`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/widget-primitives), the contract both widget authors and hosts share. Its full surface (the contract types, the discovery hook, and the render component) is covered in the _Widget Primitives / Introduction_ story. In the pipeline it does two things.

`useWidgetTypes( records )` takes the host-supplied records, imports each record's `widget_module` for the live metadata, and merges it with the record into `WidgetType[]`. The record's `presentation` and `category`, both sourced from `widget.json`, win over the module's value. The hook reaches for no store or endpoint; the dashboard, for instance, reads its own `widgetModule` core-data entity (backed by `/wp/v2/widget-modules`) and passes the records in.

`<WidgetRender>` then resolves a `WidgetType.renderModule` through a host-provided `ResolveWidgetModule` and mounts the component with the `attributes` / `setAttributes` contract. On a WordPress page the resolver can be as simple as `( id ) => import( id )`; hosts with other loading strategies supply their own.

For what a widget declares through that contract, layer by layer, see [Anatomy of a widget type](https://github.com/WordPress/gutenberg/blob/HEAD/packages/widget-primitives/src/stories/anatomy.md).

## Hosts

The dashboard engine ([`@wordpress/widget-dashboard`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/widget-dashboard), mounted by `routes/dashboard/`) is the host this repository ships today. It shows what a host owns:

-   Registers the `widgetModule` core-data entity in its page init module, which `@wordpress/boot` runs before the dashboard renders.
-   Reads the entity's records and passes them to `useWidgetTypes( records )`.
-   Owns the layout array and its persistence.
-   Wraps every instance in its own chrome: header, toolbars, error boundary, Suspense fallback.
-   Passes `resolveWidgetModule` down through its context, overridable for tests and Storybook.

The same `WidgetType` could be rendered by any other host, and where and how to render belongs entirely to the host. Every host is a consumer of the package, but not every consumer is a host: tests, Storybook, or a picker that only lists widget types consume the same contract without rendering anything.

## Why a standalone package

The pipeline above splits in one place: everything up to the REST endpoint is WordPress infrastructure, and everything after `WidgetType[]` is a host concern. The contract in between is small, stable, and needed by both sides, which is the shape of a package:

-   Widget authors depend on it to type their metadata and render components.
-   Hosts depend on it to discover and mount widgets without knowing how they were built or registered.
-   Neither side needs the other's dependencies: the package keeps its own footprint minimal (`element`, plus type-only `dataviews`); discovery is data-source agnostic, so it no longer depends on `core-data`/`data`.
