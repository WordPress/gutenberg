# Widget Type Composer, plan

The atomic steps that build the feature. Read `ARCHITECTURE.md` first and
`CONVENTIONS.md` for the workflow. Each step is one `wtc/NN-<slug>` branch.

Status: `todo` | `in-progress` (+ branch/owner) | `done`. Keep this table the
single source of truth for progress.

## Upstream in flight, 2026-08-17

Three PRs opened on trunk after this round's re-homing, all touching ground
this plan builds on. The next round reconciles them once merged:

-   **WordPress/gutenberg#81740, the widget host links seam.** `WidgetHost` /
    `WidgetHostProvider` / `useWidgetHost` land in `widget-primitives` with
    the `links` capability (`match` + the router's `Link`), consumed by the
    actions menu and the footer, provided by the dashboard route. This is the
    seam step 17 planned to create: on landing, 17 shrinks to extending the
    bag with `navigate` / `notify` for the operations of step 16, plus one
    decision it must settle: `renderBlocks` (step 10) travels as a prop while
    capabilities travel by context; unify the mechanism.
-   **WordPress/gutenberg#81738, module-less widget resolution.**
    `useWidgetTypes` resolves a record without a metadata module from its own
    fields (`apiVersion` default, record metadata, wire actions, icon
    stand-in). This is most of step 07's no-module branch: on landing, 07's
    diff shrinks to the genuinely server-defined additions (`origin`,
    `definition_id`, `content` and their runtime mapping).
-   **WordPress/gutenberg#81729, the Site Health page.** The dashboard app's
    second route, reached from the widget through a plain link action, page
    titles replaced by breadcrumbs. Gives link fulfillments a real in-app
    target for demos, and the breadcrumb back-link already navigates
    client-side.

## Trunk re-homing, 2026-08-17

Steps 00-10 sat 292 commits behind `trunk`. Same procedure as the previous
round: hub and spokes rebased onto current `trunk` preserving the
hub-and-spoke shape, every spoke re-pointed at its reproduced commit. Backups
live in the `wtc-backup/2026-08-17/*` tags.

The substantive collisions all trace to the widget icon pipeline
(WordPress/gutenberg#80969) and the action envelope work
(WordPress/gutenberg#81275, #81381, #81556) landing on `trunk`. Re-homed, not
restored:

-   **01** · `trunk` now carries `icon` (a registered icon reference) and
    wire-form `actions` on `WidgetModuleRecord`. The step's own `icon` addition
    dropped; only `origin`, `definition_id`, and `content` remain genuinely new.
-   **02** · textual only: `trunk` inserted `gutenberg_sanitize_widget_icon()`
    at the same spot the step inserts its registration helper. Both stand.
-   **03** · the bootstrap conflict was the removed `gutenberg-content-types`
    experiment. In review, the code-registered loop now passes `icon` through
    `gutenberg_sanitize_widget_icon()`, extending the registration-gate
    doctrine `trunk` established for manifest icons; test fixtures moved to
    the `collection/icon-name` shape the sanitizer enforces.
-   **05** · no textual conflict, and that was the trap: the step's `icon`
    emission and schema entry auto-merged alongside `trunk`'s own, leaving a
    duplicate REST field. The duplicate dropped in review; the step keeps
    `origin` / `definition_id` / `content` and the cpt title branch.
-   **07** · the server-defined branch now integrates with `trunk`'s icon
    resolution: a record icon reference enters as the pending stand-in and
    resolves off the loading gate like any other, and wire actions pass
    through `withRenderableIcons()` so hosts keep receiving only renderable
    icons.
-   **08** · textual only: `trunk` dropped dependency-group comments in
    `widget-render.tsx`.

Cross-step alignment, applied as a hub commit as in the last round: the lint
conventions now reject dependency-group comment headers (new files are not
covered by the bulk suppressions of WordPress/gutenberg#81248), so the
renderer files dropped theirs; `core-widget-defs.php` re-aligned per the
current phpcs ruleset.

Settled from the last round's open items: the `WidgetModuleRecord.icon` string
vs `WidgetType.icon` element divergence. The declarative icon pipeline
resolves the wire reference at the `useWidgetTypes` boundary.

Still open:

-   CHANGELOG entries for `@wordpress/widget-primitives` before steps become
    PRs.
-   Steps 14-17 were rewritten against the action envelope as of the last
    round; the envelope has since gained `icon`, `relevance`, and the
    wire/resolved split. The connection-language steps do not collide with
    that (their entry point is the `steps` fulfillment); reviewed and left as
    written.

## Trunk re-homing, 2026-08-03

Steps 00-09 were built in June and sat ~780 commits behind `trunk`. The hub and
its ten spokes were rebased onto current `trunk` preserving the hub-and-spoke
shape; every spoke was re-pointed at its reproduced commit. Backups live in the
`wtc-backup/2026-07-31/*` tags.

Six spokes conflicted, and each conflict marked a June assumption that `trunk`
had since invalidated. Re-homed, not restored:

-   **00** · `trunk` removed the `gutenberg-omnibar` experiment; the flag entry
    moved rather than reinstating it.
-   **01** · `WidgetModuleRecordOverrides` already covered `presentation`,
    `title`, and `description`. Only `origin`, `definition_id`, `content`, and
    `icon` remained genuinely new.
-   **02** · the origin resolver was rebuilt **on top of** the current
    registration function, keeping metadata translation and the `help` / `actions`
    sanitizers, rather than replacing it as the June version did.
-   **05** · `title` no longer branches by origin. Since built-in types carry a
    server-side, translated title, the REST value is the registry entry for
    built-in and code-registered, falling back to `post_title` only for `cpt`.
-   **07** · the hook keeps `resolveFields` and the record-override merge, with
    the step's `buildRuntimeFields` layered on.

Open after the re-home:

-   `WidgetModuleRecord.icon` is a string while `WidgetType.icon` is a React
    element. The type assertion tolerates it today; the two converge through the
    declarative-icon work (WordPress/gutenberg#80938).
-   The steps add production code to `@wordpress/widget-primitives` with no
    `CHANGELOG.md` entries. Decide per-step or once, before these become PRs.
-   No runtime caller registers a widget definition yet, so the feature is
    invisible with the flag on. Step 10 carries the first demo.

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

| NN  | Title                 | Phase               | Depends on | Status |
| --- | --------------------- | ------------------- | ---------- | ------ |
| 00  | gate-scaffold         | Foundation          | none       | done   |
| 01  | js-contract           | Foundation          | none       | done   |
| 02  | widget-type-origin    | Server framework    | 00         | done   |
| 03  | code-registered       | Server framework    | 02         | done   |
| 04  | cpt-defs              | Server framework    | 02         | done   |
| 05  | controller-fields     | Server framework    | 02         | done   |
| 06  | render-endpoint       | Server framework    | 03, 04     | done   |
| 07  | use-widget-types      | Discovery           | 01, 05     | done   |
| 08  | widget-render-routing | Discovery           | 07         | done   |
| 09  | renderer-core         | Renderer core       | 08         | done   |
| 10  | ssr-fallback          | Renderer core       | 09, 06     | done   |
| 11  | block-context         | Renderer core       | 09         | todo   |
| 12  | ui-primitives         | Primitive blocks    | 09         | todo   |
| 13  | binding-sources       | Binding language    | 11         | todo   |
| 14  | expression            | Connection language | none       | todo   |
| 15  | connection-runtime    | Connection language | 09, 14     | todo   |
| 16  | operations            | Connection language | 15         | todo   |
| 17  | host-provider         | Connection language | 16         | todo   |
| 18  | form-block            | DataViews-as-block  | 13, 16     | todo   |
| 19  | collection-block      | DataViews-as-block  | 18         | todo   |
| 20  | style-control         | Style control       | 16         | todo   |
| 21  | demos-and-docs        | Demos + docs        | 19, 17     | todo   |

## Step details

Oracle paths below are on `recovered/widget-type-composer`. `WP-PRIM` =
`packages/widget-primitives/src`, `WP-DASH` = `packages/widget-dashboard/src`,
`COMP` = `lib/experimental/widget-type-composer`, `DASH` =
`lib/experimental/dashboard-widgets`, `ABR` = `WP-PRIM/components/admin-block-renderer`.

### 00 · gate-scaffold

Register the `gutenberg-widget-type-composer` experiment and gate an (empty)
`COMP/` load from `lib/load.php`. No behavior yet.

-   Files: `lib/experimental/experiments/load.php` (flag entry), `lib/load.php`
    (gate require).
-   Accept: flag appears on the Experiments screen; enabling it loads nothing
    observable; off = inert.

### 01 · js-contract

Extend the widget contract types for server-defined origins.

-   Files: `WP-PRIM/types.ts`, add `origin`/`content`/`definitionId` to
    `WidgetType`; add `origin`/`definition_id`/`content`/`title`/`description`/
    `icon` to `WidgetModuleRecord`.
-   Accept: `tsgo` clean; no runtime change.

### 02 · widget-type-origin

Teach the resolver and registry about `origin`. `WP_Widget_Type` already stores
arbitrary props (`set_props` + `#[AllowDynamicProperties]`); tag built-in
entries with `origin => 'built-in'`.

-   Files: `DASH/widget-types.php` (`gutenberg_register_widget_type_if_new` helper;
    built-in loop tags origin), `DASH/class-wp-widget-type.php` (doc the new props).
-   Accept: built-in widget types still register and resolve; each carries
    `origin = 'built-in'`.

### 03 · code-registered

The in-memory registry of code-declared definitions and the resolver loop that
registers them with `origin = 'code-registered'` and inline `content`.

-   Files: `COMP/widget-definitions.php` (`gutenberg_register_widget_def`,
    `gutenberg_get_registered_widget_defs`, registry-by-ref), `DASH/widget-types.php`
    (code-registered loop).
-   Accept: a test def registered on `init` appears in the registry with its
    content + metadata.

### 04 · cpt-defs

The `widget_def` post type (caps, meta, REST at `/wp/v2/widget-defs`) and the
resolver loop registering each post with `origin = 'cpt'` + `definition_id` +
inline `content`.

-   Files: `COMP/widget-definitions.php` (CPT + meta + `user_has_cap` synth),
    `DASH/widget-types.php` (cpt loop).
-   Accept: a published `widget_def` post appears as `widget-def/{slug}` in the
    registry; caps gate CRUD to `manage_options`.

### 05 · controller-fields

Emit the server-defined fields over `/wp/v2/widget-modules`.

-   Files: `DASH/class-wp-rest-widget-modules-controller.php` -
    `prepare_item_for_response` + schema for `origin`/`content`/`definition_id`/
    `title`/`description`/`icon`.
-   Accept: REST response carries the fields per origin (built-in → null content;
    cpt title from the post).

### 06 · render-endpoint

Server render of a composition: `/wp/v2/widget-defs/render` runs `do_blocks()`
with per-instance attributes seeded into block context; PHP instance-attribute
binding source.

-   Files: `COMP/widget-definitions.php` (`render` route + callback),
    `COMP/instance-attribute-source.php`.
-   Accept: POSTing `content` + `attributes` returns resolved HTML with the
    attributes applied.

### 07 · use-widget-types

Resolve server-defined records in the discovery hook (keep trunk's
records-param API).

-   Files: `WP-PRIM/hooks/use-widget-types.ts`, `buildRuntimeFields`,
    `DEFAULT_API_VERSION`, the no-`widget_module` branch.
-   Accept: records with `origin` code-registered/cpt yield a `WidgetType` with
    `content`; built-in unchanged.

### 08 · widget-render-routing

Branch `WidgetRender` on `origin`; server-defined → `AdminBlockRenderer`
(a stub that renders `content` text is enough here).

-   Files: `WP-PRIM/components/widget-render/widget-render.tsx`,
    `WP-PRIM/index.ts` (export), stub `ABR/admin-block-renderer.tsx`.
-   Accept: a code-registered widget reaches the stub renderer; built-in path
    unchanged.

### 09 · renderer-core

The real single-tree renderer: `createAdminBlock` (eventless variant), the admin
block registry, and `AdminBlockRenderer` walking the grammar-parsed tree.

-   Files: `ABR/create-admin-block.tsx`, `ABR/registry.ts`,
    `ABR/admin-block-renderer.tsx`, `ABR/types.ts`, `ABR/index.ts`,
    `ABR/admin-blocks/index.ts`.
-   Accept: a composition of one registered admin block renders its component;
    package `sideEffects` keeps `ABR/**` registrations (see CONVENTIONS).

### 10 · ssr-fallback

Per-block fallback for blocks with no admin component: serialize the node and
render it through the `06` endpoint.

-   Files: `ABR/serialize-node.ts`, `ABR/ssr-fallback-block.tsx`
    (+ `.module.css`).
-   Accept: a composition mixing a registered block and a `core/paragraph`
    renders the paragraph via the server, in order.

### 11 · block-context

Context flow by name: `providesContext`/`usesContext` and the provider.

-   Files: `ABR/block-context.tsx`, `ABR/create-admin-block.tsx`
    (wire provides/uses).
-   Accept: a parent block provides a value its descendant consumes by name.

### 12 · ui-primitives

The primitive admin blocks.

-   Files: `ABR/admin-blocks/{stack,text,button,icon,icon-button,badge,card,link,icons}.tsx`.
-   Accept: each renders from its declared attributes; `core-admin/*` names
    registered.

### 13 · binding-sources

Read-bindings: resolve `metadata.bindings` from a named source against context;
the binding-source registry and the JS `core/instance-attribute` source wired to
the `06` seeding.

-   Files: `ABR/binding-sources.ts`, `ABR/create-admin-block.tsx`
    (`resolveReadBindings`).
-   Accept: an attribute bound to `core/instance-attribute` renders the instance
    value.

### 14 · expression

The serializable CEL-subset evaluator for `{ $expr }` args and `when` guards.

-   Files: `ABR/expression.ts`, `ABR/test/expression.test.ts`.
-   Accept: member access, literals, comparison, boolean logic, short-circuit;
    missing member → undefined; tests green. (Pure; can be done anytime.)

### 15 · connection-runtime

Run a connection: ordered async steps, per-step `when`, connection-level
`onError`; the event-capable `createAdminBlock` variant; the operation context.

The runtime takes a step list and a scope, and knows nothing about where the
list came from. Keep that boundary: a block event is the entry point this step
builds, and a widget action's `steps` fulfillment is a second one that arrives
later without touching the runtime. Do not reach for the composition from
inside it.

-   Files: `ABR/connection-runtime.ts`, `ABR/operation-context.tsx`,
    `ABR/types.ts` (Connection types), `ABR/create-admin-block.tsx` (event
    variant).
-   Accept: a button with a one-step connection runs the step; `when` gates the
    trigger; pending state flows to the component; the runtime is callable with
    a step list alone, demonstrated by a test that invokes it without a block.

### 16 · operations

The operation registry and the shipped operations; the error contract.

Named `operation`, not `action`: see _Operations, not actions_ in
`ARCHITECTURE.md`. `action` already means a declared widget verb
(`WidgetAction`) and dashboard chrome (`WidgetDashboard.Actions`), and this is
neither.

-   Files: `ABR/operations.ts`, `registerOperation`/`getOperation`,
    `save-entity` (`throwOnError`), `refetch`, `navigate`, `notify`.
-   Accept: a connection that saves then notifies works; a rejecting step runs
    `onError`; an unregistered operation name leaves the step a no-op rather
    than throwing.

### 17 · host-provider

The host capabilities a widget cannot confirm exist, provided through
`WidgetHostProvider` and mounted around the rendered widgets.

Two consumers, not one. Operations read `host.navigate` / `host.notify`. And a
declared action with a `link` fulfillment needs the host's link primitive, so a
target inside the host's own routes materializes as a router link instead of a
full page load; the widget declares where to go, the host decides how to get
there.

Sort each capability before writing it. A WordPress-generic implementation goes
in the adapter module; a genuine host decision goes in the host. See _Who
provides what_ in `ARCHITECTURE.md`.

-   Files: `WP-PRIM/components/admin-block-renderer/widget-host.tsx`
    (`WidgetHostProvider`, `useWidgetHost`), `WP-DASH` mount point, the route's
    concrete capabilities.
-   Accept: `navigate` / `notify` operations take effect on the dashboard; a
    widget with no provider still renders and host-boundary operations no-op; a
    link action to an in-app route does not reload the page.

### 18 · form-block

`core-admin/form` as the form primitive (one `DataForm` over a declarative
schema), owning `data` + validity, providing a `form` context; `core-admin/field`.

-   Files: `ABR/admin-blocks/form.tsx`, `ABR/admin-blocks/field.tsx`.
-   Accept: the create-draft composition (see oracle `core/connection-form-demo`)
    creates a draft via `save-entity`.

### 19 · collection-block

`core-admin/collection` as the dataset primitive (one `DataViews` over core-data
records), providing a `collection` context; row actions compiled to DataViews
actions with `when` → `isEligible`.

-   Files: `ABR/admin-blocks/collection.tsx`.
-   Accept: the recent-posts composition (oracle `core/collection-demo`) lists
    posts and a row action changes status then refetches.

### 20 · style-control

Path-bound style control: `core-admin/select-control` + a global-styles provider
block and `style-variations`, plus the `set-style-value` operation and a
global-style binding source.

-   Files: `ABR/admin-blocks/{select-control,global-styles,style-variations}.tsx`,
    `ABR/operations.ts` (`set-style-value`), `ABR/admin-blocks/index.ts` (register).
-   Accept: oracle `core/site-styles` renders and changing a control writes a
    global style.

### 21 · demos-and-docs

The code-registered demo definitions and the architecture docs.

-   Files: `COMP/core-widget-defs.php` (latest-posts, create-a-new-post,
    create-draft, recent-posts, site-styles, ...), optional probe seed, the
    renderer `README.md`, finalize this folder.
-   Accept: the demos appear in the dashboard and render; docs match the shipped
    behavior.
