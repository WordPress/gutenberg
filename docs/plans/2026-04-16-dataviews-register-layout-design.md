# DataViews: `registerLayout` API (POC)

**Status:** Proof of concept
**Package:** `@wordpress/dataviews`
**Date:** 2026-04-16

## Context

Today the set of DataViews layouts (`table`, `grid`, `list`, `activity`, `pickerGrid`, `pickerTable`) is a closed, hardcoded array at
[`packages/dataviews/src/components/dataviews-layouts/index.ts`](../../packages/dataviews/src/components/dataviews-layouts/index.ts). The package exposes no
`register*` function, no filter hook, and no slot/fill for layouts. Plugins wanting to render data in a shape the built-ins don't
support fall back to CSS overrides and prop-shape hacks against internal class names.

A real example of that fallback pattern is the ciab-admin "Replace custom offline payments UI with DataForm" change, which needed to:

- Hide `thead` with a screen-reader-only CSS trick so column headers wouldn't render.
- Set `view.layout.styles.{title,actions}.width` to fake a "primary content fills / actions shrink-wrap" row shape.
- Neuter the view-switcher, search, sort, column-reorder, and pagination via stub props and `search={ false }`.
- Override `.dataviews-view-table td`, `.dataviews-view-table__row:first-child`, and `.components-card__body` in route-level SCSS.

Every one of those except the last is something the layout component itself should decide. A registration API lets plugins ship
their own layout component and opt out of the built-ins' shape entirely, instead of papering over it with CSS.

## Goal

Enable a plugin to register a DataViews layout type such that `view.type === '<customType>'` routes to the plugin's component.

**Render-only POC.** The custom layout renders when selected. Nothing else integrates: no view-switcher entry, no view-config menu,
no type validation, no persistence affordances. Those are deliberate follow-ups.

## Non-goals

- `unregisterLayout` / cleanup on plugin deactivation — not needed for a proof of concept.
- View-switcher icon integration.
- View-config menu integration (density picker, column visibility, etc.).
- A `@wordpress/data` store for the registry. A plain module-level `Map` is sufficient; no subscriptions are required.
- Dynamic TypeScript narrowing per custom layout type. We widen `View` with one permissive `ViewCustom` variant.

## Public API

A new module at `packages/dataviews/src/components/dataviews-layouts/registry.ts`:

```ts
import type { ComponentType, ReactElement } from 'react';
import type { ViewBaseProps } from '../types';

export interface LayoutDefinition< Item = any > {
    type: string;
    label: string;
    component: ComponentType< ViewBaseProps< Item > >;
    icon?: ReactElement;
}

export function registerLayout( layout: LayoutDefinition ): void;
export function getRegisteredLayout( type: string ): LayoutDefinition | undefined;
export function getRegisteredLayouts(): LayoutDefinition[];
```

Re-exported from `packages/dataviews/src/index.ts` alongside the existing `VIEW_LAYOUTS` export.

### Semantics

- `registerLayout` throws if `type` collides with a built-in (`table`, `grid`, `list`, `activity`, `pickerGrid`, `pickerTable`) or
  with a previously-registered type. This matches `registerBlockType`'s duplicate-registration behavior.
- Registry state is module-level: a single `Map<string, LayoutDefinition>` shared across the process. Same lifetime model as
  `@wordpress/blocks`' block type registry.
- An internal `__clearRegisteredLayouts()` is exported for test teardown only, not re-exported from the package index.

## Implementation

Four files change:

### 1. `packages/dataviews/src/components/dataviews-layouts/registry.ts` — new, ~40 lines

Implements `registerLayout`, `getRegisteredLayout`, `getRegisteredLayouts`, `__clearRegisteredLayouts`. Module-level `Map`.

### 2. `packages/dataviews/src/components/dataviews-layout/index.tsx` — lookup change

Current lookup (line 43):

```ts
const ViewComponent = VIEW_LAYOUTS.find(
    ( v ) => v.type === view.type && defaultLayouts[ v.type ]
)?.component;
```

Becomes:

```ts
const ViewComponent =
    VIEW_LAYOUTS.find(
        ( v ) => v.type === view.type && defaultLayouts[ v.type ]
    )?.component
    ?? getRegisteredLayout( view.type )?.component;
```

Built-ins keep their `defaultLayouts[ v.type ]` gate — changing that would alter existing behavior for consumers that rely on it.
Registered layouts skip the gate: a plugin registers globally, so requiring every consumer to add the custom type to
`defaultLayouts` would defeat the point.

### 3. `packages/dataviews/src/types/dataviews.ts` — widen `View`

Add one permissive variant:

```ts
export interface ViewCustom extends ViewBase {
    type: string;                  // anything not matching a built-in
    layout?: Record< string, any >;
}

export type View =
    | ViewList
    | ViewGrid
    | ViewTable
    | ViewPickerGrid
    | ViewPickerTable
    | ViewActivity
    | ViewCustom;
```

Plugin code can typecheck against `ViewCustom` without casts. Existing typed call sites over built-ins are unaffected.

### 4. `packages/dataviews/src/index.ts` — exports

Add `registerLayout`, `getRegisteredLayout`, `getRegisteredLayouts`, and the `LayoutDefinition` type.

## Demo

### Storybook story

New file `packages/dataviews/src/dataviews/stories/register-layout-poc.story.tsx`. Registers a `pocCardRows` layout — a
flex row per item, primary field on the left, secondary fields on the right, no column headers, no borders, styling owned by the
layout's component. The fixture resembles the offline-payments-style use case that motivated the API so readers can see the
1:1 replacement.

Accessible labels (`aria-labelledby` on each row) are baked into the layout component so the story doubles as a correct example —
layouts that omit headers still need to announce column context to screen readers.

The story uses the existing Free Composition entry point (`<DataViews.Layout />`) to render layout-only output.

### Unit tests

New file `packages/dataviews/src/dataviews-layouts/test/registry.ts` with four cases:

1. `registerLayout` then `getRegisteredLayout` returns the definition.
2. `getRegisteredLayouts` returns all registered definitions.
3. `registerLayout` throws on built-in collision and on duplicate registration.
4. `<DataViewsLayout>` with `view.type === 'pocCardRows'` renders the registered component (verifies the lookup wire-up).

Suite calls `__clearRegisteredLayouts()` in `afterEach` to isolate tests.

## Validation

Against the ciab-admin offline-payments migration, a `pocCardRows`-style registered layout removes:

- The `thead { clip: rect(0 0 0 0) … }` CSS hack.
- The `view.layout.styles.{title,actions}.width` column-width hack.
- `enableMoving: false` (column-reorder UI isn't rendered at all).
- All `.dataviews-view-table *` targeting in route-level SCSS.

What still stays because it's outside this POC's scope: stub `onChangeView`, `paginationInfo`, `isLoading`; DataForm-as-card-chrome.

## Future work (not in this POC)

- View-switcher and view-config-menu integration for registered layouts.
- `unregisterLayout`, with subscriber notification so live-mounted DataViews instances react.
- Filter hook on `VIEW_LAYOUTS` for layered composition (multiple plugins adding layouts).
- TypeScript variance so each registered layout can narrow `view.layout` to its own shape.
- Documentation in the DataViews handbook.
