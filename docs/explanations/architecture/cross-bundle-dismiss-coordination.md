# Cross-Bundle Dismiss Coordination for Base UI Overlays

## Problem Statement

In the Gutenberg bundling model, `@wordpress/ui` has `wpScript: false`. When multiple `wpScript: true` packages (e.g., `@wordpress/block-editor`, `@wordpress/editor`) import from `@wordpress/ui`, each package's build bundles its own copy of `@wordpress/ui` and its dependency `@base-ui/react`.

Each copy of `@base-ui/react` executes its own `React.createContext()` calls at load time, creating independent context objects. This means React contexts like `FloatingTree`, `PopoverRootContext`, and `DialogRootContext` are **not shared** across bundles.

The key shared resource is **React itself** — `react` and `react-dom` are externalized as vendor scripts (`window.React`, `window.ReactDOM`), so all bundles share the same React instance and a unified React component tree.

The question: **Does dismiss coordination (click-outside, Escape key) break when overlay components from different bundles are nested?**

## Summary of Findings

| Behavior | Works across bundles? | Explanation |
|---|---|---|
| Click-outside dismiss | **Yes** | `insideReactTree` mechanism uses shared React synthetic events |
| Escape key (cross-type, e.g., Select in Dialog) | **Same as single bundle** | Select uses `bubbles: false`; Dialog uses a context counter — neither depends on FloatingTree |
| Escape key (same-type, e.g., Popover in Popover) | **Degraded** | FloatingTree context not shared; parent can't check children |
| Escape key (Dialog in Dialog, cross-bundle) | **Degraded** | Nesting counter relies on `DialogRootContext`, which is not shared across bundles |
| Modal dialog backdrop dismiss | **Yes** | Backdrop check is DOM-based, not context-based |
| Visual stacking (DOM order) | **Yes** | No z-index means later-rendered elements are on top |

**Conclusion**: The primary use case (click-outside dismiss) works correctly across bundles. This is not a hard blocker for the migration, but there are nuanced Escape key regressions to be aware of.

## Three Dismiss Strategies in Base UI

Base UI does **not** use a single unified dismiss strategy. There are three distinct mechanisms, each used by a different group of components. All three share the same `useDismiss` hook from `floating-ui-react/hooks/useDismiss.js`, but they configure it differently and layer additional coordination on top.

### Strategy 1: FloatingTree (Menu, Popover, Menubar, NavigationMenu)

These components render a `<FloatingTree>` / `<FloatingNode>` hierarchy and use `useFloatingNodeId` to track parent-child relationships at the DOM level.

| Component | Renders `<FloatingTree>` | Uses `<FloatingNode>` | Uses `useFloatingNodeId` |
|---|---|---|---|
| Menu | Yes (top-level `MenuRoot`) | Yes (`MenuPositioner`) | Yes (`MenuRoot`, `MenuTrigger`) |
| Popover | Yes (outermost `PopoverRoot`) | Yes (`PopoverPositioner`) | Yes (`PopoverPositioner`) |
| Menubar | Yes (wraps all children) | Yes (`MenubarContent`) | Yes (`MenubarContent`) |
| NavigationMenu | Yes (`NavigationMenuRoot`) | No | Yes (uses `useFloatingParentNodeId`) |

**How it works**:

- Menu: Each `MenuStore` creates a `FloatingTreeStore`. The top-level `MenuRoot` wraps children in `<FloatingTree externalTree={floatingTreeRoot}>`. Nested (submenu) roots skip the wrapper and join the existing tree. `useDismiss` is called with `externalTree` for nested menus, enabling tree-based child checks.
- Popover: Simpler. Wraps in `<FloatingTree>` only when outermost (checks `usePopoverRootContext(true)`). `PopoverPositioner` registers via `<FloatingNode>`. Detects nesting via `useFloatingParentNodeId() != null`.

**Cross-bundle impact**: FloatingTree relies on React context, so it **does not work across bundles**. A parent Popover from bundle A cannot see a child Popover from bundle B in its tree.

### Strategy 2: React Context Counter (Dialog, AlertDialog, Drawer)

These components use a **custom parent-child counter** propagated via React context (`DialogRootContext`), with no FloatingTree involvement at all.

**How it works** (from `useDialogRoot.js`):

- Each Dialog Root maintains an `ownNestedOpenDialogs` state counter.
- When a child Dialog opens, it calls the parent's `onNestedDialogOpen` callback (received via `DialogRootContext`). The parent increments its counter.
- When a child Dialog closes, it calls `onNestedDialogClose`. The parent decrements.
- `isTopmost = ownNestedOpenDialogs === 0` — only the topmost (innermost) Dialog responds to Escape and outside-press.
- `useDismiss` receives `escapeKey: isTopmost` and `outsidePress` gated by `isTopmost`.

AlertDialog reuses `useDialogRoot` with `disablePointerDismissal: true` and `modal: true`. Drawer wraps `<Dialog.Root>` and delegates all dismiss logic to it.

**Cross-bundle impact**: The counter propagates via `DialogRootContext`, which is **not shared across bundles**. If Dialog A (bundle A) nests Dialog B (bundle B), Dialog A's `onNestedDialogOpen` callback is never called. Both dialogs think they are topmost. Pressing Escape closes both. However, click-outside still works correctly thanks to `insideReactTree` (Strategy 0 below).

### Strategy 3: No Nesting Awareness (Select, Tooltip, PreviewCard, Combobox)

These components call `useDismiss` with no tree and no nesting context. They have no mechanism to coordinate with parent or child overlays beyond `insideReactTree`.

| Component | `useDismiss` options | Notes |
|---|---|---|
| Select | `bubbles: false` | Escape only closes the Select, never bubbles to parent floating elements |
| Tooltip | `referencePress: true` | Closes on trigger re-press; no nesting awareness |
| PreviewCard | Default options | Simplest usage |
| Combobox | (similar to Select) | No FloatingTree, no nesting |

**Cross-bundle impact**: None — these components have no cross-component coordination to break. Select's `bubbles: false` means Escape only closes the Select regardless of bundling.

### The Universal Safety Net: `insideReactTree`

All components — regardless of which strategy they use — share the same `useDismiss` hook, which includes the `insideReactTree` mechanism. This is the universal safety net for click-outside dismiss and works across bundles.

## How `insideReactTree` Works

Every `useDismiss` instance sets up two layers of event handling:

1. **Native capture-phase listener on `document`**: Schedules a dismiss check on the clicked target element
2. **React synthetic capture handlers on the floating element**: Set an `insideReactTree` flag via `onMouseDownCapture`, `onClickCapture`, etc.

The dismiss check runs *after* the React synthetic handlers have fired. If the `insideReactTree` flag is set, the check aborts — the click is considered "inside" the React tree and the overlay does not dismiss.

### Why it works across bundles

The mechanism depends on **React's synthetic event system**, not on Base UI's internal contexts:

1. All Base UI portals use `ReactDOM.createPortal()` from the **shared React instance**
2. `ReactDOM.createPortal()` preserves React tree parentage regardless of which bundle created the portal
3. React's synthetic events bubble through portals following the **React component tree**, not the DOM tree
4. When a user clicks on `Select.Popup` (from bundle B) rendered inside `Dialog.Popup` (from bundle A), React's synthetic capture phase fires `Dialog.Popup`'s `onMouseDownCapture` handler, setting the `insideReactTree` flag

### Event ordering

The trick relies on a specific event processing order:

```
1. NATIVE capture phase at document
   → Dialog's useDismiss capture handler fires
   → Schedules a dismiss check callback on the click target

2. NATIVE capture phase at body (React's portal container)
   → React's event delegation fires
   → Dispatches SYNTHETIC capture events through React tree:
     Root → ... → Dialog.Popup (onMouseDownCapture → sets insideReactTree=true) → ... → Select.Popup

3. NATIVE bubble phase at click target
   → The scheduled dismiss check callback fires
   → Sees insideReactTree=true → returns early, does NOT dismiss
```

Step 2 always fires before step 3 because the portal container (`body`) is an ancestor of the click target in the DOM. React's capture-phase listener fires during the native capture phase at `body`, which precedes the native bubble phase at the click target.

### Modal dialog case

For modal dialogs, there is an additional guard. The `outsidePress` function in Dialog's `useDismiss` configuration only returns `true` for clicks on the backdrop element:

```javascript
if (modal) {
  return internalBackdropRef.current === eventTarget
      || backdropRef.current === eventTarget
      || (contains(eventTarget, popupElement) && !eventTarget?.hasAttribute('data-base-ui-portal'));
}
```

Clicks on a portaled Select popup (which is not the backdrop) never satisfy this condition, so the dialog does not dismiss regardless of the `insideReactTree` mechanism.

## Escape Key Behavior

### Cross-type nesting (Select inside Dialog)

Select uses `bubbles: false` in its `useDismiss` configuration. This means pressing Escape when a Select is open only closes the Select — the event does not propagate to parent floating elements via `useDismiss`.

However, Dialog also registers a native `keydown` listener on `document`. Since `stopPropagation()` on a native event listener attached to `document` does not prevent other listeners on the same target from firing, Dialog's native handler can still fire. Whether the Dialog closes depends on its `isTopmost` check.

Within a single bundle: if the Dialog has no nested Dialogs open, `isTopmost` is `true`, and Escape closes both Select and Dialog. This is an existing single-bundle behavior, not a cross-bundle regression.

Across bundles: the same behavior occurs, since Select and Dialog don't share any coordination context regardless of bundling.

For comparison, the current `@wordpress/components` Modal uses only a React synthetic `onKeyDown` handler (not a native document listener), so Ariakit's `stopPropagation()` on the synthetic event successfully prevents the Modal from closing. This is a behavioral difference between Base UI's Dialog and the legacy Modal, unrelated to cross-bundle isolation.

### Same-type nesting (Popover inside Popover, Menu inside Menu)

Within a single bundle, same-type components share a `FloatingTree` context. When Escape is pressed on an inner Popover, the outer Popover's `useDismiss` checks `getNodeChildren(tree.nodesRef.current, nodeId)` and finds the inner Popover is open — it skips dismissing.

Across bundles, the `FloatingTree` context is not shared. The outer Popover's `useDismiss` finds no children in its FloatingTree and proceeds to dismiss. **This is a genuine cross-bundle regression for same-type nesting.**

Mitigation: Popover-in-Popover nesting naturally occurs within the same package (e.g., a color picker popover with a nested palette popover). Cross-package Popover nesting is rare. The same applies to nested menus.

### Dialog-in-Dialog nesting (cross-bundle)

Within a single bundle, Dialog's context counter (`ownNestedOpenDialogs`) tracks nested Dialogs. When a child Dialog is open, the parent knows it is not topmost and suppresses its Escape handler.

Across bundles, the `DialogRootContext` is not shared. The parent Dialog from bundle A never receives the `onNestedDialogOpen` callback from the child Dialog in bundle B. Both dialogs have `isTopmost = true`. Pressing Escape closes both.

**This is a cross-bundle regression**, though `insideReactTree` still prevents click-outside from dismissing the parent when clicking inside the child Dialog.

Mitigation: Dialog-in-Dialog nesting across packages is uncommon. When it does occur, it's typically the same package rendering both (e.g., a settings dialog opening a confirmation dialog).

## Per-Component Summary

| Component | Dismiss strategy | FloatingTree? | Nesting context | `useDismiss` config | Cross-bundle risk |
|---|---|---|---|---|---|
| Menu | Strategy 1 | Yes | `FloatingTree` + `FloatingTreeStore` | `externalTree` for nested menus | Same-type nesting breaks |
| Popover | Strategy 1 | Yes | `FloatingTree` | Default (tree via context) | Same-type nesting breaks |
| Menubar | Strategy 1 | Yes | `FloatingTree` | (via Menu internals) | Same-type nesting breaks |
| NavigationMenu | Strategy 1 | Yes | `FloatingTree` | (via Menu internals) | Same-type nesting breaks |
| Dialog | Strategy 2 | No | `DialogRootContext` counter | `escapeKey: isTopmost` | Dialog-in-Dialog Escape breaks |
| AlertDialog | Strategy 2 | No | (reuses Dialog) | `disablePointerDismissal: true` | Same as Dialog |
| Drawer | Strategy 2 | No | (wraps Dialog.Root) | (delegated to Dialog) | Same as Dialog |
| Select | Strategy 3 | No | None | `bubbles: false` | None |
| Tooltip | Strategy 3 | No | None | `referencePress: true` | None |
| PreviewCard | Strategy 3 | No | None | Default | None |
| Combobox | Strategy 3 | No | None | (similar to Select) | None |

## Stress Test

An empirical stress test accompanies this analysis. It builds two independent bundles from `@base-ui/react` (each with separate React contexts, sharing React itself) and provides interactive playgrounds:

- **wp-env admin page**: `Tools > Overlay Dismiss Test` (activate the `gutenberg-test-overlay-dismiss-stress-test` plugin)
- **Storybook stories**: Under "Cross-Bundle Dismiss" in the story browser

The test covers 5 concerns with 23 scenarios: dismiss coordination, z-index stacking, iframe rendering, focus management, and legacy `@wordpress/components` interop.

## Implications for the Migration

1. **Click-outside dismiss works across bundles** — the `insideReactTree` mechanism is universal and relies only on shared React, not on Base UI contexts. This is not a hard blocker.

2. **Escape key has nuanced regressions** — same-type nesting (Popover-in-Popover, Menu-in-Menu) and Dialog-in-Dialog across bundles lose their nesting awareness. These are uncommon cross-package patterns, but should be documented as known limitations.

3. **Select-in-Dialog is safe** — Select's `bubbles: false` means Escape only closes the Select. The Dialog's behavior on Escape is the same whether or not the Select shares a bundle. The double-dismiss issue (Dialog also closing) is a single-bundle behavior that exists today.

4. **Phases 1–3 are unaffected**: WPDS overlays can be built and deployed alongside legacy overlays.

5. **Phase 4 remains important**: Unifying all overlay internals on `@base-ui/react` within the same bundle eliminates FloatingTree isolation and Dialog context counter isolation.

6. **No strategy shift required**: The bundling model (multiple copies of `@base-ui/react`) does not create a hard blocker.

7. **Long-term option**: Promoting `@wordpress/ui` to `wpScript: true` would eliminate all context isolation concerns by making it a shared script handle. This is a Core-level decision that can be deferred.
