# Widget Primitives

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes. While it is published as 0.x, breaking changes may ship in minor releases.
</div>

The host-agnostic toolkit for dashboard widgets. It is the single source of
truth for what a widget *is* (the contract types) and the runtime for working
with widgets (discovering the registered widget types and resolving their render
modules). It is not tied to any host.

## Installation

Install the module:

```bash
npm install @wordpress/widget-primitives --save
```

_This package assumes that your code will run in an **ES2015+** environment.
If you're using an environment that has limited or no support for such
language features and APIs, you should include [the polyfill shipped in
`@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill)
in your code._

## Setup

This package ships no stylesheets and injects no styles; there is nothing
to enqueue or import.

The contract types and `<WidgetRender>` work in any React application. The
`useWidgetTypes()` hook reads the `widgetModule` entity through
`@wordpress/core-data`, so it expects to run against a WordPress site that
exposes the `/wp/v2/widget-modules` REST endpoint.

## Purpose

A widget is a self-contained unit; a *host* is any context that renders one (the
dashboard today, a sidebar or an inspector tomorrow). This package sits between
the build pipeline that produces widgets and the hosts that render them, so
neither side has to know about the other:

- **Contract.** It defines the widget type shape (`WidgetType`, `WidgetName`)
  and the render contract (`WidgetRenderProps`). Authors type their
  `widget.ts` / `render.tsx` against these, and hosts consume the same types.
  Nothing re-exports them: every consumer imports from
  `@wordpress/widget-primitives` directly, so the source of truth stays in one
  place.
- **Discovery.** `useWidgetTypes()` returns the `WidgetType[]` registered on the
  current page.
- **Rendering.** `<WidgetRender>` resolves a widget's render module via a
  host-provided resolver and mounts the resulting component under the host's
  Suspense boundary.

## Public API

- `<WidgetRender>`: canonical entry point for any host that mounts a widget.
  Resolves the widget's render module via a host-provided `resolveWidgetModule`
  and mounts the resulting component with the standard `attributes` plus
  `setAttributes` render contract. Suspense, error handling, and chrome are
  host concerns and live outside the primitive.
- `useWidgetTypes()` → `[ widgetTypes, isResolvingWidgetTypes ]`: the
  `WidgetType[]` available on the current page, plus a flag that is true while
  they are still resolving.
- Contract types: `WidgetType`, `WidgetName`, `WidgetIcon`,
  `WidgetRenderProps`, `ResolveWidgetModule`. `WidgetIcon` is a rendered SVG
  element (typically one from `@wordpress/icons`); hosts pass it to their
  icon primitive as is.

## How discovery works

The data flow uses `@wordpress/core-data` and dynamic module imports. There is
no custom data store and no client-side registration step.

1. **Server (PHP).** `WP_Widget_Type_Registry` is hydrated at `init` from the
   build manifest. One entry per widget folder under `widgets/`.
2. **REST endpoint.** `/wp/v2/widget-modules` exposes the registry. Each record
   returns `{ name, render_module, widget_module }`.
3. **core-data entity.** A `widgetModule` entity reads the endpoint via
   `getEntityRecords( 'root', 'widgetModule' )`.
4. **Hook.** `useWidgetTypes()` reads those records and `await import(
   record.widget_module )` to fetch each widget's metadata, merging it with
   `name` and `renderModule` into a `WidgetType`.

## Identity vs host

A widget type is metadata plus a render module. It belongs to no host in
particular.

The same `core/on-this-day` widget can render in a dashboard grid, a sidebar
within another page, a modal inserter, or a plugin panel. The choice of where to
render belongs to the consumer; the registry knows nothing about it.

For `import( widget.renderModule )` to resolve at runtime, the render module
needs to be available to the browser. The build pipeline registers each widget's
script module with WordPress at `init`, which makes it loadable. Hosts decide
when to import; they do not register widgets.

## Contributing to this package

This is an individual package that's part of the Gutenberg project.
The project is organized as a monorepo. It's made up of multiple
self-contained software packages, each with a specific purpose. The
packages in this monorepo are published to [npm](https://www.npmjs.com/)
and used by [WordPress](https://make.wordpress.org/core/) as well as
other software projects.

To find out more about contributing to this package or Gutenberg as a
whole, please read the project's main
[contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
