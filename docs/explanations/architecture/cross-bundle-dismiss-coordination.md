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
| Escape key (same-type, e.g., Popover in Popover) | **Yes** | React synthetic `onKeyDown` + `stopPropagation()` prevents parent from receiving Escape; shared React makes this work across bundles |
| Escape key (Dialog in Dialog, cross-bundle) | **Degraded** | Nesting counter relies on `DialogRootContext`, which is not shared across bundles |
| Modal dialog backdrop dismiss | **Yes** | Backdrop check is DOM-based, not context-based |
| Visual stacking (same-level nesting) | **Yes** | No z-index means later-rendered elements are on top |
| Visual stacking (multi-level nesting) | **Degraded** | `PortalContext` isolation causes incorrect portal nesting across bundles — see "Portal Container Nesting" below |

**Conclusion**: Both click-outside and Escape key dismiss work correctly across bundles for the most common overlay nesting patterns. Dialog-in-Dialog cross-bundle nesting is the only known Escape regression, and it is uncommon in practice. There is also a **visual stacking regression** in multi-level cross-bundle nesting caused by `PortalContext` isolation — see "Portal Container Nesting" below. Neither issue is a hard blocker for the migration.

## Three Dismiss Strategies in Base UI

Base UI does **not** use a single unified dismiss strategy. There are three distinct mechanisms, each used by a different group of components. All three share the same `useDismiss` hook from `floating-ui-react/hooks/useDismiss.js`, but they configure it differently and layer additional coordination on top.

### Strategy 1: FloatingTree (Menu, Popover, Menubar, NavigationMenu)

> **Cross-bundle: works correctly for both click-outside and Escape.** Although FloatingTree is a React context (isolated across bundles), Escape key coordination is handled by a separate mechanism: the React synthetic `onKeyDown` handler on the floating element. The inner overlay's handler calls `stopPropagation()`, preventing the outer from receiving the event through the shared React tree. Empirically verified with Popover-in-Popover cross-bundle nesting. **Confidence: high** — verified empirically in the stress test. **Practical risk: none.**

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

**Cross-bundle impact**: FloatingTree relies on React context, so the tree data structure itself **is not shared across bundles**. A parent Popover from bundle A cannot see a child Popover from bundle B in its tree. However, this does not cause a regression for Escape key behavior — see "Same-type nesting" below for details.

### Strategy 2: React Context Counter (Dialog, AlertDialog, Drawer)

> **Cross-bundle: click-outside works, Escape nesting breaks for Dialog-in-Dialog.** The `DialogRootContext` counter is isolated across bundles, so nested Dialogs from different bundles can't communicate their open state. Both think they're topmost and both close on Escape. Click-outside is unaffected. Cross-type nesting (e.g., Select inside Dialog) is also unaffected — Dialog's counter only tracks other Dialogs, not Selects. **Practical risk: low** — Dialog-in-Dialog across packages is uncommon.

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

> **Cross-bundle: fully works, no regression.** These components have no nesting coordination to break — they don't use FloatingTree or any context-based counter. Click-outside works via `insideReactTree`. Select's `bubbles: false` ensures Escape only closes the Select itself. Behavior is identical whether components share a bundle or not. **Confidence: high, practical risk: none.**

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

> **Verdict: Works correctly across bundles.** This mechanism relies on React's synthetic event system, which is shared across all bundles (React is externalized). It is the universal safety net that makes click-outside dismiss work regardless of bundle boundaries. **Confidence: high** — this is architecturally guaranteed by React's portal event bubbling, not dependent on any Base UI context.

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

> **Verdict: Works correctly across bundles.** Modal dialog dismissal uses a DOM-based backdrop check that doesn't depend on any React context. A click on a child overlay's portal is never on the backdrop, so the modal never dismisses incorrectly. **Confidence: high** — purely DOM-based check, no context sharing required.

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

> **Verdict: Same behavior as single bundle — no cross-bundle regression.** Select and Dialog never share FloatingTree or any coordination context, even within the same bundle. Select uses `bubbles: false`, so its Escape handling is self-contained. Dialog's Escape behavior depends only on its own `isTopmost` check, which is unaffected by Select's bundle. The double-dismiss issue (Escape closing both Select and Dialog) is a pre-existing single-bundle behavior. **Confidence: high** — verified in source: Select and Dialog use completely independent dismiss paths.

Select uses `bubbles: false` in its `useDismiss` configuration. This means pressing Escape when a Select is open only closes the Select — the event does not propagate to parent floating elements via `useDismiss`.

However, Dialog also registers a native `keydown` listener on `document`. Since `stopPropagation()` on a native event listener attached to `document` does not prevent other listeners on the same target from firing, Dialog's native handler can still fire. Whether the Dialog closes depends on its `isTopmost` check.

Within a single bundle: if the Dialog has no nested Dialogs open, `isTopmost` is `true`, and Escape closes both Select and Dialog. This is an existing single-bundle behavior, not a cross-bundle regression.

Across bundles: the same behavior occurs, since Select and Dialog don't share any coordination context regardless of bundling.

For comparison, the current `@wordpress/components` Modal uses only a React synthetic `onKeyDown` handler (not a native document listener), so Ariakit's `stopPropagation()` on the synthetic event successfully prevents the Modal from closing. This is a behavioral difference between Base UI's Dialog and the legacy Modal, unrelated to cross-bundle isolation.

### Same-type nesting (Popover inside Popover, Menu inside Menu)

> **Verdict: Works correctly across bundles — Escape only closes the inner overlay.** Although FloatingTree is isolated across bundles, Escape key coordination is handled by a different mechanism: the React synthetic `onKeyDown` handler attached to the floating element. The inner overlay's handler fires first and calls `stopPropagation()`, which prevents the outer from receiving the event through the shared React component tree. **Confidence: high** — empirically verified in the stress test (scenario 1.5). **Practical risk: none.**

`useDismiss` attaches `closeOnEscapeKeyDown` in two places:
1. As a **React synthetic `onKeyDown`** handler on the floating element (returned via `useInteractions`)
2. As a **native `keydown`** listener on `document` (registered in a `useEffect`)

When the inner Popover (from bundle B) is rendered inside the outer Popover's React tree (from bundle A) via `createPortal`, React's synthetic event system is shared (React is externalized). When the user presses Escape inside the inner Popover:

1. The native `keydown` event bubbles through the DOM
2. React's event delegation intercepts it and dispatches synthetic `keydown` events through the React component tree
3. The inner Popover's `onKeyDown` fires first (deeper in the React tree) → closes the inner → calls `event.stopPropagation()` (because `escapeKeyBubbles` defaults to `false`)
4. React synthetic propagation is stopped — the outer Popover's `onKeyDown` never fires
5. The outer Popover stays open

This works because `stopPropagation()` on the React synthetic event prevents further bubbling through the React tree, and the outer Popover's primary Escape handler is the React synthetic one, not the native `document` listener.

Note: within a single bundle, FloatingTree provides an additional layer of coordination (the outer checks for open children before dismissing). Across bundles, FloatingTree is isolated, but the React synthetic event mechanism described above handles the same-type nesting case correctly without it.

### Dialog-in-Dialog nesting (cross-bundle)

> **Verdict: Degraded across bundles — Escape dismisses both parent and child Dialogs.** The parent Dialog's nesting counter (`ownNestedOpenDialogs`) never increments because the child Dialog from a different bundle can't reach the parent's `DialogRootContext`. Both dialogs believe they are topmost. Click-outside still works correctly (via `insideReactTree`). **Confidence: high** — `DialogRootContext` is a React context, isolated by definition. **Practical risk: low** — Dialog-in-Dialog across different packages is uncommon; typically the same package renders both.

Within a single bundle, Dialog's context counter (`ownNestedOpenDialogs`) tracks nested Dialogs. When a child Dialog is open, the parent knows it is not topmost and suppresses its Escape handler.

Across bundles, the `DialogRootContext` is not shared. The parent Dialog from bundle A never receives the `onNestedDialogOpen` callback from the child Dialog in bundle B. Both dialogs have `isTopmost = true`. Pressing Escape closes both.

**This is a cross-bundle regression**, though `insideReactTree` still prevents click-outside from dismissing the parent when clicking inside the child Dialog.

Mitigation: Dialog-in-Dialog nesting across packages is uncommon. When it does occur, it's typically the same package rendering both (e.g., a settings dialog opening a confirmation dialog).

## Per-Component Summary

| Component | Dismiss strategy | FloatingTree? | Nesting context | `useDismiss` config | Cross-bundle risk |
|---|---|---|---|---|---|
| Menu | Strategy 1 | Yes | `FloatingTree` + `FloatingTreeStore` | `externalTree` for nested menus | None (React synthetic `onKeyDown` handles Escape) |
| Popover | Strategy 1 | Yes | `FloatingTree` | Default (tree via context) | None (empirically verified) |
| Menubar | Strategy 1 | Yes | `FloatingTree` | (via Menu internals) | None (React synthetic `onKeyDown` handles Escape) |
| NavigationMenu | Strategy 1 | Yes | `FloatingTree` | (via Menu internals) | None (React synthetic `onKeyDown` handles Escape) |
| Dialog | Strategy 2 | No | `DialogRootContext` counter | `escapeKey: isTopmost` | Dialog-in-Dialog Escape breaks |
| AlertDialog | Strategy 2 | No | (reuses Dialog) | `disablePointerDismissal: true` | Same as Dialog |
| Drawer | Strategy 2 | No | (wraps Dialog.Root) | (delegated to Dialog) | Same as Dialog |
| Select | Strategy 3 | No | None | `bubbles: false` | None |
| Tooltip | Strategy 3 | No | None | `referencePress: true` | None |
| PreviewCard | Strategy 3 | No | None | Default | None |
| Combobox | Strategy 3 | No | None | (similar to Select) | None |

## Portal Container Nesting and Visual Stacking

> **Verdict: Visual stacking regression in multi-level cross-bundle nesting.** When overlays from different bundles are deeply nested (e.g., Dialog(A) → Popover(B) → Select(A)), the innermost overlay can render *behind* a middle-level overlay due to incorrect portal container nesting. **Confidence: high** — empirically verified in the stress test (scenario 1.6) and confirmed via DOM inspection. **Practical risk: medium** — affects any three-level nesting where the innermost and outermost overlays share a bundle but the middle one does not.

### How Base UI portal nesting works

Each Base UI overlay uses `FloatingPortal` to render its floating element into a portal container `<div>`. The portal container is appended to a **parent container**, determined by `PortalContext`:

```javascript
// From FloatingPortal.js (useFloatingPortalNode)
const portalContext = usePortalContext();
const parentPortalNode = portalContext?.portalNode;
const resolvedContainer = containerProp ?? parentPortalNode ?? document.body;
```

- If a `PortalContext.Provider` ancestor exists, the portal nests inside the parent portal's container
- Otherwise, the portal appends to `document.body`

`FloatingPortal` also provides a `PortalContext.Provider` for its children, creating a chain: each overlay's portal becomes the container for the next nested overlay's portal.

### Why this breaks across bundles

`PortalContext` is created by `React.createContext()` inside each bundle's copy of `FloatingPortal.js`. Since each bundle has its own module scope, they create **separate** `PortalContext` objects:

- Bundle A: `PortalContext_A`
- Bundle B: `PortalContext_B`

In the three-level nesting scenario **Dialog(A) → Popover(B) → Select(A)**:

1. **Dialog(A)** opens — no parent in `PortalContext_A` → appends portal `div_1` to `document.body`
2. **Popover(B)** opens (rendered inside Dialog's content) — no parent in `PortalContext_B` (Dialog set `PortalContext_A`, invisible to B) → appends portal `div_2` to `document.body`, *after* `div_1`
3. **Select(A)** opens (rendered inside Popover's content) — reads `PortalContext_A`, finds Dialog's portal (`div_1`) as the nearest parent → appends portal `div_3` **inside** `div_1`

Resulting DOM:

```html
<body>
  <div data-base-ui-portal>          <!-- div_1: Dialog(A) portal -->
    <div role="dialog" ...>           <!-- Dialog content -->
    </div>
    <div data-base-ui-portal>         <!-- div_3: Select(A) portal — NESTED inside div_1 -->
      <div role="listbox" ...>        <!-- Select popup -->
      </div>
    </div>
  </div>
  <div data-base-ui-portal>          <!-- div_2: Popover(B) portal -->
    <div role="dialog" ...>           <!-- Popover popup -->
    </div>
  </div>
</body>
```

Since `div_2` (Popover B) comes **after** `div_1` (Dialog A + Select A) in DOM order, it paints on top of everything inside `div_1` — including the Select popup. The Select visually renders *behind* the Popover, even though it should be the topmost overlay.

### Single-bundle comparison

In a single bundle, all overlays share the same `PortalContext`. Select would find Popover's portal as its nearest parent (not Dialog's), and nest inside the Popover's portal container. This places it later in DOM order within the Popover's subtree, ensuring correct visual stacking.

### Impact on dismiss coordination

This is purely a **visual stacking** issue — dismiss coordination is unaffected. Click-outside and Escape key behavior work correctly regardless of portal nesting, because they rely on React synthetic events (which follow the React tree, not the DOM tree).

### Mitigation strategies

1. **Phase 2 z-index overrides**: Setting `--wp-ui-select-z-index` higher than `--wp-ui-popover-z-index` can force correct stacking during the transition period
2. **Explicit `container` prop**: Consumers can pass an explicit container to `Select.Portal` to override the default `PortalContext` resolution
3. **Phase 4 unification**: Once all overlays share a bundle (or `@wordpress/ui` becomes `wpScript: true`), `PortalContext` is shared and nesting resolves correctly
4. **Long-term**: Promoting `@wordpress/ui` to `wpScript: true` eliminates the issue entirely

## Stress Test

An empirical stress test accompanies this analysis. It builds two independent bundles from `@base-ui/react` (each with separate React contexts, sharing React itself) and provides interactive playgrounds:

- **wp-env admin page**: `Tools > Overlay Dismiss Test` (activate the `gutenberg-test-overlay-dismiss-stress-test` plugin)
- **Storybook stories**: Under "Cross-Bundle Dismiss" in the story browser

The test covers 5 concerns with 23 scenarios: dismiss coordination, z-index stacking, iframe rendering, focus management, and legacy `@wordpress/components` interop.

## Implications for the Migration

1. **Click-outside dismiss works across bundles** — the `insideReactTree` mechanism is universal and relies only on shared React, not on Base UI contexts.

2. **Escape key works correctly for most nesting patterns** — Popover-in-Popover, Menu-in-Menu, and Select-in-Dialog all work correctly across bundles. The React synthetic `onKeyDown` handler + `stopPropagation()` mechanism is shared through the common React instance. Empirically verified in the stress test.

3. **Dialog-in-Dialog is the only known Escape regression** — Dialog uses a `DialogRootContext` counter for nesting awareness, which is isolated across bundles. Both Dialogs think they are topmost and both close on Escape. This is uncommon in practice (cross-package Dialog nesting is rare).

4. **Select-in-Dialog is safe** — Select's `bubbles: false` means Escape only closes the Select. The Dialog's behavior on Escape is the same whether or not the Select shares a bundle. The double-dismiss issue (Dialog also closing) is a single-bundle behavior that exists today.

5. **Portal nesting causes visual stacking regressions** — In multi-level cross-bundle nesting (e.g., Dialog(A) → Popover(B) → Select(A)), `PortalContext` isolation causes the innermost overlay to nest inside the outermost overlay's portal container instead of the middle one's, resulting in incorrect visual stacking. This is mitigated by Phase 2 z-index overrides and fully resolved in Phase 4. See "Portal Container Nesting" above.

6. **Phases 1–3 are unaffected**: WPDS overlays can be built and deployed alongside legacy overlays. Phase 2 z-index overrides handle the portal stacking edge case during transition.

7. **Phase 4 remains valuable**: It unifies FloatingTree contexts, Dialog nesting counters, and `PortalContext` — resolving the Dialog-in-Dialog Escape regression and the portal stacking regression. The practical impact is limited but real.

8. **No strategy shift required**: The bundling model (multiple copies of `@base-ui/react`) does not create a hard blocker. The known regressions (Dialog-in-Dialog Escape, portal stacking in multi-level nesting) are manageable.

9. **Long-term option**: Promoting `@wordpress/ui` to `wpScript: true` would eliminate all context isolation concerns — dismiss coordination, portal nesting, and bundle size — by making it a shared script handle. This is a Core-level decision that can be deferred.
