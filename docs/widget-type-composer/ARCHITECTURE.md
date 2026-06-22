# Widget Type Composer, architecture

## What it is

A way to define a widget type as a **composition of blocks** instead of a
hand-written render module, and to render that composition in the admin as a
single React tree. Two declarative, serializable languages sit on top of the
composition: **bindings** (attribute values sourced at render time) and
**connections** (events wired to actions).

It builds on the existing widget framework (`@wordpress/widget-primitives` +
`WP_Widget_Type_Registry` + `/wp/v2/widget-modules`). A widget type gains an
`origin`:

- `built-in`, a build-discovered render module. The existing path, unchanged.
- `code-registered`, declared in PHP via `gutenberg_register_widget_def()`,
  held in an in-memory registry, carrying its composition `content` inline.
- `cpt`, a `widget_def` post; editable, persistent, queryable.

`built-in` renders client-side from its module; `code-registered` and `cpt`
render through the **admin block renderer**.

![Origin resolution: built-in, code-registered, and CPT origins converge through the registration helper into the widget type registry, then over REST to the client renderer. Solid boxes are shipped; dashed boxes are planned.](assets/origin-resolution.svg)

## Layers (bottom to top)

1. **Server framework**, the three origins, the resolver that merges them into
   `WP_Widget_Type_Registry`, the REST exposure (`/wp/v2/widget-modules`
   carrying `origin`/`content`/`definition_id`/`title`/`description`/`icon`), and
   the SSR render endpoint (`/wp/v2/widget-defs/render`, `do_blocks()` with
   per-instance attributes seeded into block context).
2. **Discovery**, `useWidgetTypes(records)` builds a `WidgetType` per record:
   for server-defined origins from the inline metadata, for built-in by
   importing the module.
3. **Render**, `WidgetRender` branches on `origin`; server-defined flows to
   `AdminBlockRenderer`, which parses the composition with the grammar parser
   (`@wordpress/block-serialization-default-parser`, not `blocks.parse`) and
   mounts, per block and in order, either a registered admin component or a
   per-block SSR fallback, as one React tree.
4. **Admin blocks**, declarative specs mapping block attributes to a
   component's props (`createAdminBlock`). UI primitives (stack, text, button,
   icon, badge, card, link, icon-button) plus data-bound blocks:
   `core-admin/form` over `DataForm`, `core-admin/collection` over `DataViews`.
5. **Bindings**, `metadata.bindings` resolves an attribute from a named source
   (e.g. `core/instance-attribute`) against ambient block context
   (`providesContext`/`usesContext`, mirroring `block.json`).
6. **Connections**, `metadata.connections` wires a logical event to an ordered,
   async-aware list of action steps with `when` guards and connection-level
   `onError`. Argument values and guards use a serializable subset of CEL
   (`{ "$expr": "..." }`). Handlers receive an action context of two tiers:
   intrinsic (core-data via `registry`) and host-boundary
   (`host.navigate`/`host.notify`, silent no-ops if the host omits them), so a
   widget stays host-agnostic. Shipped actions: `save-entity`, `refetch`,
   `navigate`, `notify`.

## Reference

The full behavior, edge cases, and worked examples live in the renderer's own
`README.md` (recreated in its step) and in the oracle branch
`recovered/widget-type-composer`. Treat those as the source of truth for exact
shapes.

## Status

Experimental, behind `gutenberg-widget-type-composer`. Runtime only: no editor
face yet (no `registerBlockType`, inserter, or inspector), but the specs are
shaped so an editor face can read the same declarations later.
