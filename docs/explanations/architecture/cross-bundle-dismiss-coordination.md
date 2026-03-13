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
| Escape key (cross-type, e.g., Select in Dialog) | **Same as single bundle** | Dialog and Select don't use FloatingTree regardless of bundling |
| Escape key (same-type, e.g., Popover in Popover) | **Degraded** | FloatingTree context not shared; parent can't check children |
| Modal dialog backdrop dismiss | **Yes** | Backdrop check is DOM-based, not context-based |
| Visual stacking (DOM order) | **Yes** | No z-index means later-rendered elements are on top |

**Conclusion**: The primary use case (click-outside dismiss) works correctly across bundles. This is not a hard blocker for the migration.

## How Click-Outside Dismiss Works

Base UI's `useDismiss` hook (in `@base-ui/react`) has three dismiss coordination mechanisms. The most important one — `insideReactTree` — is universal and works across bundles.

### The `insideReactTree` mechanism

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

When Escape is pressed with a Select open inside a Dialog:

1. **React synthetic handlers**: Select.Popup's `onKeyDown` fires first (deeper in the React tree), closes the Select, and calls `event.stopPropagation()`. Dialog.Popup's `onKeyDown` does NOT fire (synthetic propagation stopped).

2. **Native document listeners**: Both Dialog and Select register native `keydown` listeners on `document`. `stopPropagation()` on one listener does not prevent other listeners on the **same target** from firing. The Dialog's native handler fires and closes the Dialog.

This means pressing Escape when a Select is open inside a Dialog closes **both** the Select and the Dialog.

**This behavior exists even within a single bundle.** Dialog and Select do not participate in Base UI's `FloatingTree` context (only Popover and Menu do). There is no `FloatingTree` relationship between them regardless of bundling.

For comparison, the current `@wordpress/components` Modal uses only a React synthetic `onKeyDown` handler (not a native document listener), so Ariakit's `stopPropagation()` on the synthetic event successfully prevents the Modal from closing. This is a behavioral difference between Base UI's Dialog and the legacy Modal, unrelated to cross-bundle isolation.

### Same-type nesting (Popover inside Popover)

Within a single bundle, Popover components share a `FloatingTree` context. When Escape is pressed on an inner Popover, the outer Popover's `useDismiss` checks FloatingTree children and finds the inner Popover — it skips dismissing.

Across bundles, the `FloatingTree` context is not shared. The outer Popover's `useDismiss` finds no children in its FloatingTree and proceeds to dismiss. **This is a genuine cross-bundle regression for same-type nesting.**

Mitigation: Popover-in-Popover nesting naturally occurs within the same package (e.g., a color picker popover with a nested palette popover). Cross-package Popover nesting is rare.

## Other Mechanisms

### `FloatingTree` (supplementary, not universal)

`FloatingTree` is a React context-based tree that tracks parent-child relationships between floating elements. It is created by `Popover.Root` (for the outermost popover) and `Menu.Root` (for top-level menus). Nested instances register as children.

`FloatingTree` provides:
- DOM containment checks across child nodes (redundant with `insideReactTree` for click-outside)
- The `bubbles` option for coordinating Escape key dismissal
- Event emission for close coordination

Since `FloatingTree` relies on React context, it **does not work across bundles**. However, `insideReactTree` (which does work across bundles) handles the critical click-outside case independently.

### Dialog nesting protocol

Dialog has its own nesting mechanism via `DialogRootContext` parent-child communication. A parent Dialog tracks how many nested Dialogs are open (`ownNestedOpenDialogs`) and disables its own Escape/outside-press handlers when it's not the topmost Dialog.

This protocol only tracks nested **Dialogs**, not other overlay types like Select or Popover.

## Stress Test

An empirical stress test accompanies this analysis. It builds two independent bundles from `@base-ui/react` (each with separate React contexts, sharing React itself) and provides interactive playgrounds:

- **wp-env admin page**: `Tools > Overlay Dismiss Test` (activate the `gutenberg-test-overlay-dismiss-stress-test` plugin)
- **Storybook stories**: Under "Cross-Bundle Dismiss" in the story browser

The test covers 5 concerns with 23 scenarios: dismiss coordination, z-index stacking, iframe rendering, focus management, and legacy `@wordpress/components` interop.

## Implications for the Migration

1. **Phases 1–3 are unaffected**: WPDS overlays can be built and deployed alongside legacy overlays. Click-outside dismiss works correctly across bundles.

2. **Phase 4 remains important**: Unifying all overlay internals on `@base-ui/react` eliminates the FloatingTree isolation issue and ensures consistent Escape key behavior.

3. **No strategy shift required**: The bundling model (multiple copies of `@base-ui/react`) does not create a hard blocker.

4. **Long-term option**: Promoting `@wordpress/ui` to `wpScript: true` would eliminate all context isolation concerns by making it a shared script handle. This is a Core-level decision that can be deferred.
