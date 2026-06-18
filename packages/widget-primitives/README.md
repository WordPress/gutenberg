# Widget Primitives

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

The host-agnostic toolkit for dashboard widgets: the contract types that define
what a widget is, plus the runtime to discover the registered widget types and
resolve their render modules. It belongs to no host.

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

That endpoint ships with the Gutenberg plugin and, at this experimental
stage, is registered only while the `gutenberg-dashboard-widgets` experiment
is enabled. On a site without it, `useWidgetTypes()` resolves to an empty
list; the contract types and `<WidgetRender>` do not depend on the endpoint
and work regardless.

## Public API

-   `<WidgetRender>`: canonical entry point for any host that mounts a widget.
    Resolves the widget's render module via a host-provided `resolveWidgetModule`
    and mounts the resulting component with the standard `attributes` plus
    `setAttributes` render contract. Suspense, error handling, and chrome are
    host concerns and live outside the package.
-   `useWidgetTypes()` → `[ widgetTypes, isResolvingWidgetTypes ]`: the
    `WidgetType[]` available on the current page, plus a flag that is true while
    they are still resolving.
-   Contract types: `WidgetType`, `WidgetName`, `WidgetIcon`,
    `WidgetRenderProps`, `ResolveWidgetModule`. `WidgetIcon` is a rendered SVG
    element (typically one from `@wordpress/icons`); hosts pass it to their
    icon primitive as is.

## Architecture

For how the full pipeline fits together (authoring, build, server registry, and
hosts), see the
[dashboard widget system architecture document](https://github.com/WordPress/gutenberg/blob/HEAD/docs/explanations/architecture/dashboard-widgets.md).

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
