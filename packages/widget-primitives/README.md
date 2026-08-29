# Widget Primitives

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

The host-agnostic toolkit for widgets: the contract types that define what a
widget is, plus the runtime to discover widget types and resolve their render
modules.

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

This package ships no stylesheets; there is nothing to enqueue or import.

The contract types, `<WidgetRender>`, and `useWidgetTypes()` work in any
React application. The host fetches the widget-module records however it
wants and passes them in; `useWidgetTypes( records )` imports each record's
metadata module and returns the resolved `WidgetType[]`.

On a WordPress site the records come from the `/wp/v2/widget-modules` REST
endpoint, exposed while the `gutenberg-dashboard-widgets` experiment is
enabled. The dashboard reads it through a `@wordpress/core-data` entity and
passes the records to the hook.

An empty list of records resolves to an empty `widgetTypes` with
`isResolvingWidgetTypes` set to `false`. Passing `null` (or `undefined`) keeps
the hook in its loading state: `widgetTypes` is empty and
`isResolvingWidgetTypes` stays `true`.

## Public API

### `<WidgetRender>`

It's the entry point for any host that mounts a widget. It resolves the render module via a host-provided `resolveWidgetModule` and mounts the component using the `attributes` / `setAttributes` contract.

Error handling and chrome stay with the host, which wraps the lazy render in a `Suspense` boundary.

### `useWidgetTypes( records )`

It takes host-supplied records (`WidgetModuleRecord[]`, or `null` while loading) and imports each one's metadata module. It returns `[ widgetTypes, isResolvingWidgetTypes ]`; the flag stays `true` until they resolve.

### `WidgetHostProvider` / `useWidgetHost`

It's the seam through which the embedding application provides what only it knows, as a `WidgetHost` bag of optional capabilities. The provider merges its value over the inherited one; an absent capability degrades to the host-agnostic behavior.

The first capability is `links` (`WidgetHostLinks`): `match` resolves a href to an in-app route (a string, path and query as the router takes them, or `null` for anything the application does not own), and `Link` is the router's primitive, which must render a real anchor and forward `ref` to it. A matched link action navigates client-side; `null`, `download`, and `openInNewTab` keep the plain anchor.

Consumers reach the anchor through that ref: a link that drops it is skipped by keyboard navigation and loses its tooltip. The Widget Host Storybook page carries the one test that pins it.

### Contract types

`WidgetType`, `WidgetName`, `WidgetIcon`, `WidgetRenderProps`, `ResolveWidgetModule`, and `WidgetModuleRecord`. `WidgetIcon` is a rendered SVG element that hosts pass to their icon primitive as-is; in `widget.json` a widget declares a registered icon name instead, resolved before it reaches hosts.

### `WidgetAttributeField< Item >`

It's an authoring helper: a DataViews `Field` whose `id` is narrowed to the widget's attribute keys.
Its optional `relevance` hint (`'high' | 'medium' | 'low'`) marks attributes a host may promote to a prominent surface.

### `WidgetAction`

It's a declarative verb a widget type exposes: an envelope (`id`, `label`, optional `icon` and `relevance`) plus exactly one fulfillment, named by the key carrying it.
Today the only key is `href`, a link target, with optional `download` / `openInNewTab`.
`data:` and `javascript:` hrefs are rejected at registration. Prefer a file next to the widget, an absolute URL, or `downloadBlob` for generated content.

The widget names the intent and how it is fulfilled; the host mounts the primitive and owns placement.

### Field types

`registerFieldType( definition )` names a reusable field type — `{ name: 'location', baseType: 'text', Edit, ... }`, typed by `FieldTypeDefinition`. Those attributes reference via `type`.

`useWidgetTypes` resolves those references into the plain per-field `Field` props DataViews understands, inheriting the rest from `baseType`.

### Icons

`registerIconResolver( resolver )` registers how a registered icon name (`"icon": "core/calendar"` in `widget.json`) becomes a renderable element. The application registers it once; `useWidgetTypes` resolves references while assembling each `WidgetType`, so hosts only receive renderable icons. An unresolvable reference degrades to no icon.

## Architecture

For how the full pipeline fits together (authoring, build, server registry, and
hosts), see the
[dashboard widget system architecture document](https://github.com/WordPress/gutenberg/blob/HEAD/docs/explanations/architecture/dashboard-widgets.md).

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
