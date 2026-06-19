# Widget Type Composer, plan

The atomic steps that build the feature. Read `ARCHITECTURE.md` first and
`CONVENTIONS.md` for the workflow. Each step is one `wtc/NN-<slug>` branch.

Status: `todo` | `in-progress` (+ branch/owner) | `done`. Keep this table the
single source of truth for progress.

## Dependency spine

```
0 ──▶ 1
0 ──▶ 2 ──▶ 3 ─┐
       2 ──▶ 4 ─┤
       2 ──▶ 5  │
              3,4 ──▶ 6
1,5 ──▶ 7 ──▶ 8 ──▶ 9 ─┬─▶ 11 ─▶ 13 ─┐
                       ├─▶ 12         │
              9,6 ──▶ 10              │
            (14 pure) ─▶ 15 ─▶ 16 ─▶ 17
                          13,16 ──▶ 18 ─▶ 19
                              16 ──▶ 20
                       19,17 ──▶ 21
```

Parallelizable once their deps are on the feature branch: {3,4,5}, {11,12},
{14 anytime}, {18-branch and 20} after 16.

## Steps

| NN | Title | Phase | Depends on | Status |
|----|-------|-------|------------|--------|
| 00 | gate-scaffold | Foundation | none | done |
| 01 | js-contract | Foundation | none | done |
| 02 | widget-type-origin | Server framework | 00 | todo |
| 03 | code-registered | Server framework | 02 | todo |
| 04 | cpt-defs | Server framework | 02 | todo |
| 05 | controller-fields | Server framework | 02 | todo |
| 06 | render-endpoint | Server framework | 03, 04 | todo |
| 07 | use-widget-types | Discovery | 01, 05 | todo |
| 08 | widget-render-routing | Discovery | 07 | todo |
| 09 | renderer-core | Renderer core | 08 | todo |
| 10 | ssr-fallback | Renderer core | 09, 06 | todo |
| 11 | block-context | Renderer core | 09 | todo |
| 12 | ui-primitives | Primitive blocks | 09 | todo |
| 13 | binding-sources | Binding language | 11 | todo |
| 14 | expression | Connection language | none | todo |
| 15 | connection-runtime | Connection language | 09, 14 | todo |
| 16 | actions | Connection language | 15 | todo |
| 17 | host-provider | Connection language | 16 | todo |
| 18 | form-block | DataViews-as-block | 13, 16 | todo |
| 19 | collection-block | DataViews-as-block | 18 | todo |
| 20 | style-control | Style control | 16 | todo |
| 21 | demos-and-docs | Demos + docs | 19, 17 | todo |

## Step details

Oracle paths below are on `recovered/widget-type-composer`. `WP-PRIM` =
`packages/widget-primitives/src`, `WP-DASH` = `packages/widget-dashboard/src`,
`COMP` = `lib/experimental/widget-type-composer`, `DASH` =
`lib/experimental/dashboard-widgets`, `ABR` = `WP-PRIM/components/admin-block-renderer`.

### 00 · gate-scaffold
Register the `gutenberg-widget-type-composer` experiment and gate an (empty)
`COMP/` load from `lib/load.php`. No behavior yet.
- Files: `lib/experimental/experiments/load.php` (flag entry), `lib/load.php`
  (gate require).
- Accept: flag appears on the Experiments screen; enabling it loads nothing
  observable; off = inert.

### 01 · js-contract
Extend the widget contract types for server-defined origins.
- Files: `WP-PRIM/types.ts`, add `origin`/`content`/`definitionId` to
  `WidgetType`; add `origin`/`definition_id`/`content`/`title`/`description`/
  `icon` to `WidgetModuleRecord`.
- Accept: `tsgo` clean; no runtime change.

### 02 · widget-type-origin
Teach the resolver and registry about `origin`. `WP_Widget_Type` already stores
arbitrary props (`set_props` + `#[AllowDynamicProperties]`); tag built-in
entries with `origin => 'built-in'`.
- Files: `DASH/widget-types.php` (`gutenberg_register_widget_type_if_new` helper;
  built-in loop tags origin), `DASH/class-wp-widget-type.php` (doc the new props).
- Accept: built-in widget types still register and resolve; each carries
  `origin = 'built-in'`.

### 03 · code-registered
The in-memory registry of code-declared definitions and the resolver loop that
registers them with `origin = 'code-registered'` and inline `content`.
- Files: `COMP/widget-definitions.php` (`gutenberg_register_widget_def`,
  `gutenberg_get_registered_widget_defs`, registry-by-ref), `DASH/widget-types.php`
  (code-registered loop).
- Accept: a test def registered on `init` appears in the registry with its
  content + metadata.

### 04 · cpt-defs
The `widget_def` post type (caps, meta, REST at `/wp/v2/widget-defs`) and the
resolver loop registering each post with `origin = 'cpt'` + `definition_id` +
inline `content`.
- Files: `COMP/widget-definitions.php` (CPT + meta + `user_has_cap` synth),
  `DASH/widget-types.php` (cpt loop).
- Accept: a published `widget_def` post appears as `widget-def/{slug}` in the
  registry; caps gate CRUD to `manage_options`.

### 05 · controller-fields
Emit the server-defined fields over `/wp/v2/widget-modules`.
- Files: `DASH/class-wp-rest-widget-modules-controller.php` -
  `prepare_item_for_response` + schema for `origin`/`content`/`definition_id`/
  `title`/`description`/`icon`.
- Accept: REST response carries the fields per origin (built-in → null content;
  cpt title from the post).

### 06 · render-endpoint
Server render of a composition: `/wp/v2/widget-defs/render` runs `do_blocks()`
with per-instance attributes seeded into block context; PHP instance-attribute
binding source.
- Files: `COMP/widget-definitions.php` (`render` route + callback),
  `COMP/instance-attribute-source.php`.
- Accept: POSTing `content` + `attributes` returns resolved HTML with the
  attributes applied.

### 07 · use-widget-types
Resolve server-defined records in the discovery hook (keep trunk's
records-param API).
- Files: `WP-PRIM/hooks/use-widget-types.ts`, `buildRuntimeFields`,
  `DEFAULT_API_VERSION`, the no-`widget_module` branch.
- Accept: records with `origin` code-registered/cpt yield a `WidgetType` with
  `content`; built-in unchanged.

### 08 · widget-render-routing
Branch `WidgetRender` on `origin`; server-defined → `AdminBlockRenderer`
(a stub that renders `content` text is enough here).
- Files: `WP-PRIM/components/widget-render/widget-render.tsx`,
  `WP-PRIM/index.ts` (export), stub `ABR/admin-block-renderer.tsx`.
- Accept: a code-registered widget reaches the stub renderer; built-in path
  unchanged.

### 09 · renderer-core
The real single-tree renderer: `createAdminBlock` (eventless variant), the admin
block registry, and `AdminBlockRenderer` walking the grammar-parsed tree.
- Files: `ABR/create-admin-block.tsx`, `ABR/registry.ts`,
  `ABR/admin-block-renderer.tsx`, `ABR/types.ts`, `ABR/index.ts`,
  `ABR/admin-blocks/index.ts`.
- Accept: a composition of one registered admin block renders its component;
  package `sideEffects` keeps `ABR/**` registrations (see CONVENTIONS).

### 10 · ssr-fallback
Per-block fallback for blocks with no admin component: serialize the node and
render it through the `06` endpoint.
- Files: `ABR/serialize-node.ts`, `ABR/ssr-fallback-block.tsx`
  (+ `.module.css`).
- Accept: a composition mixing a registered block and a `core/paragraph`
  renders the paragraph via the server, in order.

### 11 · block-context
Context flow by name: `providesContext`/`usesContext` and the provider.
- Files: `ABR/block-context.tsx`, `ABR/create-admin-block.tsx`
  (wire provides/uses).
- Accept: a parent block provides a value its descendant consumes by name.

### 12 · ui-primitives
The primitive admin blocks.
- Files: `ABR/admin-blocks/{stack,text,button,icon,icon-button,badge,card,link,icons}.tsx`.
- Accept: each renders from its declared attributes; `core-admin/*` names
  registered.

### 13 · binding-sources
Read-bindings: resolve `metadata.bindings` from a named source against context;
the binding-source registry and the JS `core/instance-attribute` source wired to
the `06` seeding.
- Files: `ABR/binding-sources.ts`, `ABR/create-admin-block.tsx`
  (`resolveReadBindings`).
- Accept: an attribute bound to `core/instance-attribute` renders the instance
  value.

### 14 · expression
The serializable CEL-subset evaluator for `{ $expr }` args and `when` guards.
- Files: `ABR/expression.ts`, `ABR/test/expression.test.ts`.
- Accept: member access, literals, comparison, boolean logic, short-circuit;
  missing member → undefined; tests green. (Pure; can be done anytime.)

### 15 · connection-runtime
Run a connection: ordered async steps, `when`, connection-level `onError`; the
event-capable `createAdminBlock` variant; the action context and `WidgetHost`
contract + `useWidgetHost`.
- Files: `ABR/connection-runtime.ts`, `ABR/action-context.tsx`,
  `ABR/widget-host.tsx`, `ABR/types.ts` (Connection types),
  `ABR/create-admin-block.tsx` (event variant).
- Accept: a button with a one-step connection runs the step; `when` gates the
  trigger; pending state flows to the component.

### 16 · actions
The action registry and the shipped actions; the error contract.
- Files: `ABR/actions.ts`, `registerAction`/`getAction`, `save-entity`
  (`throwOnError`), `refetch`, `navigate`, `notify`.
- Accept: a connection that saves then notifies works; a rejecting step runs
  `onError`.

### 17 · host-provider
The dashboard's concrete host capabilities, provided through `WidgetHostProvider`
and wired around the rendered widgets.
- Files: `WP-DASH/components/widget-host-provider/*`, plus the mount point in the
  dashboard's widget rendering.
- Accept: `navigate`/`notify` actions take effect on the dashboard; a widget
  with no provider still renders (host-boundary actions no-op).

### 18 · form-block
`core-admin/form` as the form primitive (one `DataForm` over a declarative
schema), owning `data` + validity, providing a `form` context; `core-admin/field`.
- Files: `ABR/admin-blocks/form.tsx`, `ABR/admin-blocks/field.tsx`.
- Accept: the create-draft composition (see oracle `core/connection-form-demo`)
  creates a draft via `save-entity`.

### 19 · collection-block
`core-admin/collection` as the dataset primitive (one `DataViews` over core-data
records), providing a `collection` context; row actions compiled to DataViews
actions with `when` → `isEligible`.
- Files: `ABR/admin-blocks/collection.tsx`.
- Accept: the recent-posts composition (oracle `core/collection-demo`) lists
  posts and a row action changes status then refetches.

### 20 · style-control
Path-bound style control: `core-admin/select-control` + a global-styles provider
block and `style-variations`, plus the `set-style-value` action and a
global-style binding source.
- Files: `ABR/admin-blocks/{select-control,global-styles,style-variations}.tsx`,
  `ABR/actions.ts` (`set-style-value`), `ABR/admin-blocks/index.ts` (register).
- Accept: oracle `core/site-styles` renders and changing a control writes a
  global style.

### 21 · demos-and-docs
The code-registered demo definitions and the architecture docs.
- Files: `COMP/core-widget-defs.php` (latest-posts, create-a-new-post,
  create-draft, recent-posts, site-styles, ...), optional probe seed, the
  renderer `README.md`, finalize this folder.
- Accept: the demos appear in the dashboard and render; docs match the shipped
  behavior.
