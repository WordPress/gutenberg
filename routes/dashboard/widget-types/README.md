# Widget types

Public surface for widget type discovery in the dashboard route.

## What this module exposes

`useWidgetTypes()` returns the `WidgetType[]` available on the current page.

`WidgetType`, `WidgetTypeMetadata`, `WidgetName` TypeScript types.

## How it works

The data flow uses `@wordpress/core-data` and dynamic module imports. There is no custom data store and no client-side registration step.

1. **Server (PHP).** `WP_Widget_Type_Registry` is hydrated at `init` from the build manifest. One entry per widget folder under `widgets/`.
2. **REST endpoint.** `/wp/v2/widget-modules` exposes the registry. Each record returns `{ name, render_module, widget_module }`.
3. **core-data entity.** A `widgetModule` entity reads the endpoint via `getEntityRecords( 'root', 'widgetModule' )`.
4. **Hook.** `useWidgetTypes()` reads those records and `await import( record.widget_module )` to fetch each widget's metadata. The metadata is merged with `name` and `renderModule` into a `WidgetType`.

## Identity vs surface

A widget type is metadata plus a render module. It belongs to no surface in particular.

The same `core/on-this-day` widget can be rendered in a dashboard grid, a sidebar within another page, a modal inserter, or a plugin panel. The choice of where to render belongs to the consumer; the registry knows nothing about it.

For `import( widget.renderModule )` to resolve at runtime, the render module needs to be available to the browser. The build pipeline registers each widget's script module with WordPress at `init`, which makes the module loadable. Surfaces decide when to import; they do not register widgets.

## Files

- `index.ts` — public exports (hook + types).
- `hooks/use-widget-types.ts` — reads `widgetModule` records and lazy-imports each widget's module.
- `types.ts` — `WidgetType`, `WidgetTypeMetadata`, `WidgetName`.

## Server-side

- `lib/experimental/dashboard-widgets/class-wp-widget-type.php`
- `lib/experimental/dashboard-widgets/class-wp-widget-type-registry.php`
- `lib/experimental/dashboard-widgets/class-wp-rest-widget-modules-controller.php`
- `lib/experimental/dashboard-widgets/widget-types.php`

## Status

Lives inside the dashboard route while the API stabilizes. When other surfaces start consuming it, the module will be promoted to a top-level `@wordpress/widget-types` package. The current layout (`index.ts`, `hooks/use-widget-types.ts`, `types.ts`) already matches that future shape.
