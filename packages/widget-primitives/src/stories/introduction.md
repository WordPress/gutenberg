# Widget Primitives

<div class="callout callout-alert">
This package is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

The host-agnostic toolkit for widgets. It is the single source of truth for what a widget _is_ on the client: the contract that widget authors write against and that every host renders. Nothing host-specific sits in between.

A _host_ is any context that renders widgets: a dashboard, a sidebar, a plugin panel, an application outside wp-admin. The package privileges none of them. It defines the contract and provides the runtime that turns host records into rendered widgets.

## What it exposes

### Contract types

The shapes a host reads to discover and render a widget:

- `WidgetType`, `WidgetName`, `WidgetIcon`
- `WidgetRenderProps`, `ResolveWidgetModule`, `WidgetModuleRecord`

Defined here and re-exported nowhere else.

### Authoring helper

`WidgetAttributeField< Item >` is for widget authors, not hosts. It narrows a DataViews `Field.id` to the keys of the widget's attribute object, so a typo'd field `id` is caught while authoring.

It also accepts an optional `relevance` hint (`'high' | 'low'`). The widget declares importance, not a surface. See **Anatomy** for how hosts may use it.

How a widget is authored (its folder, `widget.json`, `widget.ts`, `render.tsx`) is covered in **System Architecture**.

### Discovery

`useWidgetTypes( records )` takes host-supplied widget-module records, imports each record's metadata module, and returns:

- `WidgetType[]`
- `isResolvingWidgetTypes`, which stays `true` before records are supplied (`null` or `undefined`) and while their metadata modules are still importing

The hook reaches for no store or endpoint. The host fetches the records however it wants and passes them in.

### Field types

`registerFieldType( definition )` names a reusable field type that widget attributes can reference via `type` (for example `type: 'location'`), so an attribute ships a custom control without importing one. The consuming application owns the vocabulary; `useWidgetTypes` resolves the references into plain DataViews `Field` props while it assembles each `WidgetType`, and unregistered names degrade exactly as unknown types do in DataViews.

See **Field Types** for the full pipeline.

### Rendering

`<WidgetRender />` resolves a `WidgetType.renderModule` through a host-provided `ResolveWidgetModule` and mounts the component with the `attributes` / `setAttributes` contract.

Error handling and chrome stay with the host. Because the module is mounted lazily, the host must wrap it in a Suspense boundary.

## What it does not do

No chrome, no layout, no persistence, no data store of its own, no knowledge of any host. Those are host concerns. Keeping them out is what makes the package publishable and consumable outside the WordPress admin.
