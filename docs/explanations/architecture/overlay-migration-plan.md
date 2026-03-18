# Overlay Migration Plan

This document describes the strategy for migrating overlay components (popovers, dialogs, dropdowns, menus, tooltips, selects) from `@wordpress/components` to the WordPress Design System (`@wordpress/ui`), built on `@base-ui/react`.

## Current State

### Overlay landscape

The Gutenberg codebase has multiple overlay implementations across different packages and libraries:

| Component | Package | Underlying library | Portal mechanism |
|---|---|---|---|
| Popover | `@wordpress/components` | `@floating-ui/react-dom` + `framer-motion` | SlotFill (`Popover.Slot`) or `createPortal` fallback |
| Modal | `@wordpress/components` | Custom (focus trap + `createPortal`) | `createPortal` to body |
| Tooltip | `@wordpress/components` | `@ariakit/react` | Ariakit Portal |
| Menu | `@wordpress/components` | `@ariakit/react` | Ariakit Portal |
| DropdownMenu | `@wordpress/components` | `@ariakit/react` (v2) / Popover (legacy) | Mixed |
| CustomSelectControl v2 | `@wordpress/components` | `@ariakit/react` | Ariakit Portal |
| Dialog | `@wordpress/ui` | `@base-ui/react` | Base UI Portal |
| Popover | `@wordpress/ui` | `@base-ui/react` | Base UI Portal |
| Select | `@wordpress/ui` | `@base-ui/react` | Base UI Portal |
| Tooltip | `@wordpress/ui` | `@base-ui/react` | Base UI Portal |

### Z-index strategy

Legacy overlays use hardcoded z-index values from `packages/base-styles/_z-index.scss`:
- `.components-popover`: 1,000,000
- `.components-tooltip`: 1,000,002
- `.components-modal__screen-overlay`: 100,000

WPDS overlays use CSS custom properties with `initial` as default:
- `--wp-ui-dialog-z-index`
- `--wp-ui-popover-z-index`
- `--wp-ui-tooltip-z-index`
- `--wp-ui-select-z-index`

### Bundling model

- `@wordpress/components` has `wpScript: true` — it is registered as a shared WordPress script handle (`wp-components`). Its dependencies (`@floating-ui/react-dom`, `framer-motion`, `@ariakit/react`) are bundled into it.
- `@wordpress/ui` has `wpScript: false` — it is NOT a shared script handle. When a `wpScript: true` package imports from `@wordpress/ui`, the entire package (including `@base-ui/react`) is bundled into the consumer.
- This means multiple `wpScript: true` packages importing `@wordpress/ui` will each get their own copy of `@base-ui/react` with independent React contexts. See [Cross-Bundle Dismiss Coordination](./cross-bundle-dismiss-coordination.md) for analysis of the implications.

### SlotFill and iframe rendering

The block editor renders content inside an iframe (site editor canvas). Popovers inside the iframe use `Popover.Slot` (the `@wordpress/components` SlotFill system) to render their DOM into specific named slots. The `SlotFillProvider` with `passthrough` mode bridges the iframe boundary.

`@wordpress/components` exports `__experimentalUseSlot` which returns `{ ref }` where `ref.current` is the slot's container DOM element. This can serve as a `container` prop for Base UI's Portal, bridging WPDS popovers into existing SlotFill locations.

---

## Migration Phases

### Phase 1: Build the WPDS overlay suite

Build the full overlay component suite in `@wordpress/ui` on `@base-ui/react`:
- Popover (compound component: Root, Trigger, Portal, Popup, Arrow, etc.)
- Dialog (compound component with Header, Footer, Actions, etc.)
- Select (form primitive with Trigger, Popup, Item, etc.)
- Tooltip
- Menu / DropdownMenu
- AlertDialog

Each component uses CSS custom properties for z-index (`--wp-ui-*-z-index`) defaulting to `initial`, following the established WPDS pattern.

### Phase 2: Legacy-compat CSS layer

Create a compatibility CSS layer in the editor shells (`edit-post`, `edit-site`) that sets `--wp-ui-*-z-index` values to match the existing SCSS z-index map:

```css
:root {
  --wp-ui-popover-z-index: 1000000;
  --wp-ui-dialog-z-index: 100000;
  --wp-ui-tooltip-z-index: 1000002;
  --wp-ui-select-z-index: 1000000;
}
```

This ensures WPDS overlays stack at the same level as legacy overlays during the transition period.

### Phase 3a: Migrate Gutenberg call sites

Migrate Gutenberg-internal call sites from `@wordpress/components` popover-based components to `@wordpress/ui` equivalents, package by package. Priority order:

1. Leaf packages (`edit-post`, `edit-site`, `edit-widgets`) — fewest downstream consumers
2. Mid-level packages (`editor`, `block-library`, `format-library`)
3. Shared packages (`block-editor`) — most consumers, highest risk

Each migration replaces the import and adapts the component API. No changes to `@wordpress/components` public API.

### Phase 3b: Iframe rendering via Portal container prop

Replace the SlotFill-based iframe rendering pattern with Base UI's Portal `container` prop:

1. Access the existing slot DOM element via `useSlot( slotName ).ref.current`
2. Pass it as the `container` prop to Base UI's Portal component
3. WPDS popovers render into the same DOM location as legacy popovers, including inside iframes

This reuses the existing SlotFill infrastructure without depending on the `Fill` component.

### Phase 4: Migrate `@wordpress/components` overlay internals (mandatory)

This phase is **not optional**. Z-indexes cannot be removed from WPDS overlays while `@wordpress/components` overlays retain `z-index: 1000000` — plugin popovers using legacy components would stack above z-index-free WPDS popovers.

Swap the internal implementation of `@wordpress/components` overlay components to use `@base-ui/react`, preserving the public API exactly:

| Component | Current internals | New internals |
|---|---|---|
| Popover | `@floating-ui/react-dom` + `framer-motion` + SlotFill | `@base-ui/react/popover` |
| Modal | Custom focus trap + `createPortal` | `@base-ui/react/dialog` |
| Dropdown / DropdownMenu | Popover wrapper | Updated Popover internals |
| Tooltip | `@ariakit/react/tooltip` | `@base-ui/react/tooltip` |
| Menu | `@ariakit/react/menu` | `@base-ui/react/menu` |

Constraints:
- **No breaking changes** — API, behavior, and styling must be preserved
- Z-index values become CSS custom properties: `var(--wp-components-popover-z-index, 1000000)` (backward-compatible default)
- DOM structure changes must be minimal to avoid breaking plugin CSS selectors

### Phase 5: Remove z-index overrides

Once all overlays (both WPDS and legacy) use `@base-ui/react` under the hood:

1. Remove `--wp-ui-*-z-index` overrides from the editor shells
2. Remove `--wp-components-*-z-index` overrides
3. Remove legacy SCSS z-index entries from `_z-index.scss`
4. DOM order handles stacking correctly — no z-indexes needed

---

## Architectural Decisions

### Package layering

The three editor layers must be respected:
- `block-editor` (WordPress-agnostic) — MUST NOT depend on `core-data` or REST APIs
- `editor` (WordPress post-type-aware) — can depend on `core-data`
- `edit-post` / `edit-site` (full screens) — leaf packages

Lower layers must not depend on higher ones. The z-index compatibility layer lives in the highest layer (editor shells).

### `@wordpress/ui` is not a shared handle

`@wordpress/ui` has `wpScript: false`. This means it is bundled into each consuming `wpScript: true` package. Each bundle gets its own copy of `@base-ui/react` with independent React contexts. This is a deliberate trade-off:

- **Pro**: No Core-level decision needed to register a new shared handle
- **Pro**: Each package can update `@wordpress/ui` independently
- **Con**: Multiple copies of `@base-ui/react` on the page
- **Con**: React contexts are not shared across bundles, but empirical testing shows the impact is limited to specific edge cases:
  - **FloatingTree** (used by Popover, Menu): isolated across bundles, but Escape key coordination works correctly via shared React synthetic events — **no regression**
  - **DialogRootContext counter** (used by Dialog, AlertDialog, Drawer): Dialog-in-Dialog nesting across bundles loses topmost tracking — **minor regression** (uncommon pattern)
  - **PortalContext** (used by all overlays): portal container nesting is isolated across bundles — in multi-level nesting (e.g., Dialog(A) → Popover(B) → Select(A)), the innermost overlay can render behind a middle-level overlay due to incorrect portal nesting — **visual stacking regression** (mitigated by Phase 2 z-index overrides)
  - **No impact** on Select, Tooltip, PreviewCard, Combobox dismiss behavior — these have no nesting coordination to break

The universal `insideReactTree` mechanism (click-outside dismiss) works across bundles because it relies on shared React synthetic events, not Base UI contexts. See [Cross-Bundle Dismiss Coordination](./cross-bundle-dismiss-coordination.md) for the full analysis.

### No breaking changes in `@wordpress/components`

Phase 4 must preserve:
- All public APIs (props, callbacks, render behavior)
- All CSS class names that plugins may target
- All behavioral characteristics (focus management, dismiss behavior, animation)
- All DOM structure (where practical; minimal changes only)

### Third-party plugin compatibility

Plugins use SlotFills to inject components into the editor UI. Two categories:

- **Controlled fills**: Gutenberg owns the rendering logic (e.g., `BlockControls.Slot` renders `ToolbarButton` components). Internal components can be updated to WPDS without affecting plugins.
- **Raw fills**: Plugins directly inject legacy components. Parent container migration must not break these. Strategy: defer migration of containers with raw fills, or build compatibility wrappers.

---

## Open Questions and Risks

1. **Escape key coordination — cross-type nesting**: Base UI's Dialog closes on Escape via a native `document` keydown listener that cannot be stopped by `stopPropagation()` from a child Select's synthetic handler. This means pressing Escape with a Select open inside a Dialog closes both. This is a single-bundle behavior (Dialog and Select never share FloatingTree), not a cross-bundle regression. May need upstream fix (e.g., Dialog respecting nested floating elements) or wrapper-level mitigation.

2. ~~**Escape key coordination — same-type cross-bundle nesting**~~: Empirical testing shows this is **not a regression**. Popover-in-Popover and Menu-in-Menu work correctly across bundles — Escape only closes the inner overlay. The React synthetic `onKeyDown` handler + `stopPropagation()` mechanism is shared through the common React instance, making FloatingTree isolation irrelevant for this case.

3. **Escape key coordination — Dialog-in-Dialog cross-bundle nesting**: Dialog uses a context counter (`ownNestedOpenDialogs` via `DialogRootContext`) for nesting awareness, not FloatingTree. Across bundles, this counter is isolated — both Dialogs think they are topmost and both close on Escape. Click-outside still works correctly. Cross-package Dialog nesting is uncommon. Note: unlike Popover/Menu, Dialog disables Escape handling entirely when `isTopmost` is false (passing `escapeKey: false` to `useDismiss`), so the React synthetic `onKeyDown` handler is not attached — the counter-based mechanism is the only coordination path.

4. **Visual stacking — `PortalContext` isolation in multi-level nesting**: Base UI's `FloatingPortal` uses a `PortalContext` (React context) to nest child overlay portals inside parent overlay portals. Across bundles, this context is isolated — a child overlay from bundle A skips over a middle-level overlay from bundle B and nests inside a grandparent from bundle A instead. This causes incorrect DOM ordering and visual stacking (the child renders behind the middle overlay). Empirically verified in scenario 1.6: Dialog(A) → Popover(B) → Select(A), where the Select renders behind the Popover. Mitigated by Phase 2 z-index overrides; fully resolved in Phase 4 when all overlays share `PortalContext`.

5. **`@wordpress/ui` as shared handle**: If the multiple-bundle cost becomes unacceptable (bundle size, context isolation edge cases), `@wordpress/ui` could be promoted to `wpScript: true`. This would eliminate all context isolation concerns (FloatingTree, DialogRootContext, PortalContext). This is a Core-level decision that can be deferred.

6. **Animation parity**: `@wordpress/components` Popover uses `framer-motion` for animations. WPDS uses CSS animations / `@starting-style`. Ensuring visual parity during migration may require careful CSS work.

7. **iframe focus coordination**: When a WPDS popover portals from inside an iframe to the parent document, focus management across the iframe boundary needs testing.

8. **Performance**: Multiple copies of `@base-ui/react` in different bundles increases total JavaScript size. The impact should be measured once migrations begin.
