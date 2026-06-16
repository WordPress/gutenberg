<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Enhancements

-   `Field.Description`: Apply `text-wrap: pretty` to description text to avoid typographic widows ([#79143](https://github.com/WordPress/gutenberg/pull/79143)).

### Code Quality

-   Move `@types/react` from `dependencies` to an optional peer dependency so consumers' React type version is used ([#79095](https://github.com/WordPress/gutenberg/pull/79095)).
-   `Button` and `AlertDialog`: Reference the tone-specific `brand`/`error` disabled color tokens for disabled states instead of the `neutral` ones, to match each element's tone. Disabled `Select`/`Autocomplete`/`Combobox` list items also adopt the `brand` disabled background token. No visual change ([#79124](https://github.com/WordPress/gutenberg/pull/79124)).

## 0.15.0 (2026-06-10)

### Breaking Changes

-   Update CSS cascade layers from flat list to nested, replacing `wp-ui-utilities`, `wp-ui-components`, `wp-ui-compositions`, and `wp-ui-overrides` with a single layer `wp-ui` ([#78959](https://github.com/WordPress/gutenberg/pull/78959)).
-   Revert React back to v18 ([#78940](https://github.com/WordPress/gutenberg/pull/78940)).

### Code Quality

-   Add missing `@types/react` dependency ([#78882](https://github.com/WordPress/gutenberg/pull/78882)).

### Bug Fixes

-   `AlertDialog`: Fix the footer collapsing to a row depending on stylesheet load order ([#78953](https://github.com/WordPress/gutenberg/pull/78953)).
-   `Button.Icon`: Preserve icon view boxes so icons with non-standard `viewBox` values are not clipped ([#78614](https://github.com/WordPress/gutenberg/pull/78614)).
-   `Tabs`: `onValueChange` now fires for automatic tab selection — when `Tabs` itself picks a tab without a consumer-supplied value (initial uncontrolled mount with no `defaultValue`, fallback to the first enabled tab when the first tab is disabled, or fallback when the currently selected tab is removed or becomes disabled) — inherited from [`@base-ui/react@1.5.0`](https://github.com/mui/base-ui/releases/tag/v1.5.0) ([#78448](https://github.com/WordPress/gutenberg/pull/78448)).

### Enhancements

-   `Tooltip`: Use `--wpds-border-radius-md` for portaled popup surfaces, aligning with menus and popovers ([#78983](https://github.com/WordPress/gutenberg/pull/78983)).
-   `Popover`: Animate the popup open and closed ([#78885](https://github.com/WordPress/gutenberg/pull/78885)).
-   `Tooltip.Provider`: Widen the types to accept all props of the equivalent `Tooltip.Provider` from `@base-ui/react` (types-only change) ([#78642](https://github.com/WordPress/gutenberg/pull/78642)).

### Internal

-   Update `@base-ui/react` from `1.4.1` to [`1.5.0`](https://github.com/mui/base-ui/releases/tag/v1.5.0) ([#78448](https://github.com/WordPress/gutenberg/pull/78448)).

## 0.14.0 (2026-05-27)

### Breaking Changes

-   Upgrade React to v19 ([#61521](https://github.com/WordPress/gutenberg/pull/61521)).

### New Features

-   `Card`: `Card.FullBleed` now supports edge-bumping in additional positions ([#77856](https://github.com/WordPress/gutenberg/pull/77856)):
    -   As the **first child of `Card.Header`**, it extends flush to the card's top and side edges — ideal for hero images. Inter-sibling spacing is consumer-managed: compose `Card.Header` with `Stack` via the `render` prop to add a gap between the hero and following siblings (e.g. `Card.Title`).
    -   As the **sole child of `Card.Content`**, it extends flush to the card's side edges and additionally to the top edge when `Content` is the first card child, or the bottom edge when it is the last. This enables full-bleed content panels with or without a header above them.
-   Add `Combobox` primitive ([#78399](https://github.com/WordPress/gutenberg/pull/78399)).

### Enhancements

-   Export `getWpCompatOverlaySlot()` so consumers can route their own portals into the compat overlay slot ([#78183](https://github.com/WordPress/gutenberg/pull/78183)).
-   `Select`, `SelectControl`: Default the popup's portal container to the `@wordpress/ui` compat overlay slot when present, so select popups stack reliably above other overlays in mixed-library compositions. A caller-supplied `Select.Portal` `container` prop continues to take precedence ([#78372](https://github.com/WordPress/gutenberg/pull/78372)).
-   `Autocomplete`: Default the popup's portal container to the `@wordpress/ui` compat overlay slot when present, so autocomplete popups stack reliably above other overlays in mixed-library compositions. A caller-supplied `Autocomplete.Portal` `container` prop continues to take precedence ([#78375](https://github.com/WordPress/gutenberg/pull/78375)).

### Bug Fixes

-   `IconButton`: Default `focusableWhenDisabled` to `true`, matching `Button` ([#78526](https://github.com/WordPress/gutenberg/pull/78526)).
-   `Button`: Do not show the interactive cursor when disabled ([#78479](https://github.com/WordPress/gutenberg/pull/78479)).
-   `Button`: Fix disabled and hover styles for neutral minimal buttons with `aria-pressed="true"` ([#78635](https://github.com/WordPress/gutenberg/pull/78635)).
-   `Autocomplete`: Fix the TypeScript prop types for the `Root` and `Value` primitives ([#78450](https://github.com/WordPress/gutenberg/pull/78450)).
-   `Autocomplete`: Disable the clear button when the autocomplete is disabled, and hide it from assistive technologies ([#78520](https://github.com/WordPress/gutenberg/pull/78520)).
-   Apply shared item popup typography to inline lists and empty states ([#78403](https://github.com/WordPress/gutenberg/pull/78403)).
-   Stretch the compat overlay slot to viewport size so portaled popups stop collapsing to their min-content width — most visible on long-text tooltips, which wrapped to one word per line ([#78441](https://github.com/WordPress/gutenberg/pull/78441)).

## 0.13.0 (2026-05-14)

### Breaking Changes

-   `InputControl`: Narrow the TypeScript type of the `label` prop to plain strings ([#77860](https://github.com/WordPress/gutenberg/pull/77860)).
-   `Select`: `Select.Item` values that are empty strings no longer render with placeholder styling on the trigger. Use the new `placeholder` prop on `Select.Trigger`, or a `null` item value, instead ([#78076](https://github.com/WordPress/gutenberg/pull/78076)).
-   `Select`: `Select.Trigger` now renders a default `"Select"` placeholder when no value is selected, where it previously rendered empty ([#78076](https://github.com/WordPress/gutenberg/pull/78076)).
-   `Select`: `Select.Item` no longer renders its `value` as fallback item content. Pass item content explicitly as `children`. Migrate `<Select.Item value="Foo" />` to `<Select.Item value="Foo">Foo</Select.Item>` ([#77861](https://github.com/WordPress/gutenberg/pull/77861)).
-   `Tooltip`: **`Popup` positioner API** ([#78089](https://github.com/WordPress/gutenberg/pull/78089)). Add a `Tooltip.Positioner` subcomponent and an optional `positioner` prop on `Tooltip.Popup` (when omitted, the default `Tooltip.Positioner` is used). Remove `side`, `align`, and `sideOffset` from `Tooltip.Popup`; pass `positioner={ <Tooltip.Positioner side="…" align="…" sideOffset={ … } /> }` instead. The new subcomponent exposes the full positioner surface (`alignOffset`, `anchor`, `collisionAvoidance`, `collisionBoundary`, `collisionPadding`, `sticky`, etc.) and mirrors the existing `portal` slot pattern.
-   `CollapsibleCard.Header`: Now renders an outer `<div>` wrapper around the trigger. Forwarded props (`className`, `aria-*`, `data-*`) and `ref` land on this outer wrapper instead of the inner click-target div ([#77962](https://github.com/WordPress/gutenberg/pull/77962)).
-   `Popover`: **`Popup` positioner API** ([#78168](https://github.com/WordPress/gutenberg/pull/78168)). Add a `Popover.Positioner` subcomponent and an optional `positioner` prop on `Popover.Popup` (when omitted, the default `Popover.Positioner` is used). Remove `side`, `align`, `sideOffset`, `alignOffset`, `anchor`, `arrowPadding`, `collisionAvoidance`, `collisionBoundary`, `collisionPadding`, and `sticky` from `Popover.Popup`; pass `positioner={ <Popover.Positioner side="…" align="…" anchor={ … } /> }` instead.
-   `Tooltip`, `Popover`, `Select`, `Autocomplete`, `Dialog`, `Drawer`, `AlertDialog`: Narrow the TypeScript types of the `Portal` subcomponent props to the package's standard `ComponentProps` shape. `className` and `style` no longer accept the `(state) => …` callback variant, and `render` no longer accepts the two-arg `(props, state) => …` variant from Base UI. Runtime behavior is unchanged ([#78168](https://github.com/WordPress/gutenberg/pull/78168)).

### New Features

-   Add `SelectControl` component ([#77809](https://github.com/WordPress/gutenberg/pull/77809)).

### Bug Fixes

-   `Text`: Provide CSS defense values for every variant when rendered as either a paragraph or heading element ([#78172](https://github.com/WordPress/gutenberg/pull/78172)).
-   `Autocomplete`, `Select`: Do not show the interactive cursor for disabled select triggers or disabled popup items ([#78112](https://github.com/WordPress/gutenberg/pull/78112)).
-   `Select`: Hide the browser focus ring on highlighted popup items ([#77919](https://github.com/WordPress/gutenberg/pull/77919)).
-   `Drawer`: Restore the slide-out animation when the popup closes ([#77800](https://github.com/WordPress/gutenberg/pull/77800)).
-   `Drawer`: Forward the `render` prop on `Drawer.Content` to the scroll container instead of leaking it as a DOM attribute, matching `Dialog.Content` ([#77941](https://github.com/WordPress/gutenberg/pull/77941)).

### New Features

-   Add `useEnableWpCompatOverlaySlot()` hook to opt into a body-level overlay container that stacks `@wordpress/ui` overlays above `@wordpress/components` overlays in mixed-library compositions. The slot auto-enables wherever `window.wp.components` is on the global (the typical script-loader setup for WordPress plugins and admin screens), so the hook is mostly relevant for hosts that bundle `@wordpress/components` (or only `@wordpress/ui`) directly — apps that aren't built with standard WordPress build tooling. Per-component support will be added incrementally ([#77851](https://github.com/WordPress/gutenberg/pull/77851)).

### Enhancements

-   `Button`: Allow long labels to wrap within constrained containers ([#78300](https://github.com/WordPress/gutenberg/pull/78300)).
-   `Select`: Add a `placeholder` prop to `Select.Trigger`, and support `null` item values for clearable placeholder options ([#78076](https://github.com/WordPress/gutenberg/pull/78076)).
-   `Drawer`: Fade the popup elevation shadow alongside the slide ([#77800](https://github.com/WordPress/gutenberg/pull/77800)).
-   `Drawer`: Allow mouse-drag swipe-dismiss in the popup-edge padding gutter ([#77800](https://github.com/WordPress/gutenberg/pull/77800)).
-   `Tooltip`: Default the floating popup's portal container to the `@wordpress/ui` compat overlay slot when present, so tooltips stack reliably above other overlays in mixed-library compositions. A caller-supplied `Tooltip.Portal` `container` prop continues to take precedence ([#78095](https://github.com/WordPress/gutenberg/pull/78095)).
-   `IconButton`: Add a `positioner` prop, accepting a `<Tooltip.Positioner />` element, to customize how the tooltip is positioned relative to the button ([#78089](https://github.com/WordPress/gutenberg/pull/78089)).
-   `CollapsibleCard.Header`: Pass `render={ <h2 /> }` (or any of `<h1>`–`<h6>`) to wrap the trigger in a heading and contribute to the document outline, following the W3C APG accordion pattern (heading wraps button) ([#77962](https://github.com/WordPress/gutenberg/pull/77962)).
-   `Select`: Add a `Select.Positioner` subcomponent and a `positioner` slot prop on `Select.Popup` to customize the popup placement, mirroring the existing `portal` slot pattern ([#78168](https://github.com/WordPress/gutenberg/pull/78168)).
-   `Autocomplete`: Add an `Autocomplete.Positioner` subcomponent and a `positioner` slot prop on `Autocomplete.Popup` to customize the popup placement, mirroring the existing `portal` slot pattern ([#78168](https://github.com/WordPress/gutenberg/pull/78168)).

### Internal

-   `Dialog`: Use `--wpds-motion-*` design tokens for animation duration and easing ([#76097](https://github.com/WordPress/gutenberg/pull/76097)).
-   Add internal `getWpCompatOverlaySlot()` helper and a co-located unlayered CSS module that lazily provide a body-level `[data-wp-compat-overlay-slot]` container at z-index `1000000003`, gated by `useEnableWpCompatOverlaySlot()` and by auto-detection of `window.wp.components` ([#77851](https://github.com/WordPress/gutenberg/pull/77851)).

## 0.12.0 (2026-04-29)

### Breaking Changes

-   `Dialog`, `AlertDialog`, `Popover`, `Tooltip`, `Select`: **`Popup` portal API** ([#77452](https://github.com/WordPress/gutenberg/pull/77452)). Add `Portal` subcomponents and an optional `portal` prop on `Popup` (when omitted, the default `Portal` is used). Remove `container` from every `Popup` and `portalClassName` from `Dialog.Popup` / `AlertDialog.Popup`; pass `portal={ <Matching.Portal … /> }` for `container`, `className`, `style`, and other portal options.
-   `Popover`, `Tooltip`, `Select`: `style` and `className` on `Popup` are now forwarded to the inner Base UI `Popup` element instead of the outer `Positioner`. To override the per-instance z-index, pass `portal={ <Overlay.Portal style={ { '--wp-ui-<overlay>-z-index': '9999' } } /> }` (or set the variable globally on a wrapping element); inline `style={ { zIndex: … } }` on `Popup` no longer reaches the positioned element.
-   `Dialog`, `Drawer`: Scrolling now requires the new `Dialog.Content` / `Drawer.Content` subcomponent; the popup itself no longer scrolls. Rendering `Header` / `Footer` as siblings of `Content` pins them to the popup edges; nesting them inside `Content` opts out of pinning. `AlertDialog.Popup` adds `stickyHeader` / `stickyFooter` props (default `true`) for the same choice on its internal chrome ([#77559](https://github.com/WordPress/gutenberg/pull/77559)).

### New Features

-   Add `Drawer` primitive ([#76690](https://github.com/WordPress/gutenberg/pull/76690)).
-   Add `Autocomplete` primitive ([#77642](https://github.com/WordPress/gutenberg/pull/77642)).

### Documentation

-   Restructure setup docs into "Within standard WordPress editor screens" and "Elsewhere" for clarity ([#77338](https://github.com/WordPress/gutenberg/pull/77338)).

### Bug Fixes

-   `Link`: Fix text decoration on the `unstyled` variant when `openInNewTab` is enabled, and simplify new-tab icon markup ([#77420](https://github.com/WordPress/gutenberg/pull/77420)).
-   `Dialog`, `AlertDialog`, `Popover`, `Tooltip`, `Select`: Restore focus-trap tabbability through `ThemeProvider`'s `display: contents` wrapper ([#77381](https://github.com/WordPress/gutenberg/pull/77381), [#77520](https://github.com/WordPress/gutenberg/pull/77520)).
-   Remove the transitive peer dependency on `date-fns` / `@date-fns/tz` ([#77520](https://github.com/WordPress/gutenberg/pull/77520)), resolving [#77395](https://github.com/WordPress/gutenberg/issues/77395).
-   `Text`: Apply both heading and paragraph CSS defenses regardless of variant, so the correct defense kicks in based on the rendered element rather than the typographic variant ([#77461](https://github.com/WordPress/gutenberg/pull/77461)).
-   `CollapsibleCard`: Fix missing keyboard focus ring on the header chevron icon when rendered inside wp-admin ([#77468](https://github.com/WordPress/gutenberg/pull/77468)).
-   `CollapsibleCard`: Prevent the focus ring of focusable descendants from being clipped by the panel's overflow once the panel is fully expanded ([#77667](https://github.com/WordPress/gutenberg/pull/77667)).
-   `Tabs`: Fix missing keyboard focus ring on the panel in Windows High Contrast mode when rendered inside wp-admin ([#77469](https://github.com/WordPress/gutenberg/pull/77469)).

### Enhancements

-   `Dialog` / `AlertDialog` / `Drawer`: Pin header / footer chrome to the popup edges when the body overflows, and show separator borders only while there is off-screen content in that direction ([#77559](https://github.com/WordPress/gutenberg/pull/77559)).
-   `Dialog`: Add `Dialog.Description` sub-component, expose `onOpenChangeComplete`, skip the backdrop when `modal` is not `true`, use `100dvh` for viewport-based heights so the popup fits the dynamic viewport on mobile, and forward `className` on `Dialog.Title` ([#77194](https://github.com/WordPress/gutenberg/pull/77194)).
-   `Dialog`: `Dialog.Header` and `Dialog.Footer` now default to `<header>` and `<footer>` elements for richer landmark semantics. Their `ref` type widens from `HTMLDivElement` to `HTMLElement`; pass `render` to opt out of the default tag ([#76690](https://github.com/WordPress/gutenberg/pull/76690)).
-   `Dialog`, `Popover`: Upgrade dev-only title validation from mount-only to cleanup-based re-validation, catching conditionally rendered titles ([#77165](https://github.com/WordPress/gutenberg/pull/77165)).
-   `Link`: Honor `openInNewTab` consistently instead of treating hash links as a special case ([#77422](https://github.com/WordPress/gutenberg/pull/77422)).
-   `Select`: Tighten spacing after checkmark when `Select.Item` is `size="small"` ([#77642](https://github.com/WordPress/gutenberg/pull/77642)).
-   `Dialog`, `Drawer`, `Popover`: Align title and description colors across all three overlay primitives. Title color is now authored explicitly (resilient to global CSS defenses), and description color now inherits from the popup foreground token instead of overriding to the weak variant ([#77692](https://github.com/WordPress/gutenberg/pull/77692)).
-   `Dialog`, `AlertDialog`, `Drawer`, `Popover`, `Select`, `Tooltip`: Unify the hairline border across overlay popups. Popups without a backdrop show a token-colored border in regular mode; popups with a backdrop hide the border (which would be redundant with the backdrop's containment); all popups show a `CanvasText` border in forced-colors mode ([#77691](https://github.com/WordPress/gutenberg/pull/77691)).
-   `Link`: Use `text-decoration-thickness: from-font` so the underline honors the font's metrics, instead of a fixed sub-pixel value that renders inconsistently across device pixel ratios ([#77790](https://github.com/WordPress/gutenberg/pull/77790)).

### Internal

-   Update `@base-ui/react` from `1.4.0` to [`1.4.1`](https://github.com/mui/base-ui/releases/tag/v1.4.1) ([#77520](https://github.com/WordPress/gutenberg/pull/77520)).
-   Extract shared `useScheduleValidation` hook; refactor `Dialog`, `Popover`, and `Tabs` validation contexts to use it ([#77165](https://github.com/WordPress/gutenberg/pull/77165)).
-   `Tabs`: Wrap two validation timeout waits in `act(...)` to avoid intermittent test warnings ([#77319](https://github.com/WordPress/gutenberg/pull/77319)).

## 0.11.0 (2026-04-15)

### Breaking Changes

-   `Text`: Apply `margin: 0`, removing user-agent margins when the component renders as block-level elements (for example `p` or `h1`–`h6` via `render` prop) ([#76970](https://github.com/WordPress/gutenberg/pull/76970)).
-   `AlertDialog`: Revise component API ([#76937](https://github.com/WordPress/gutenberg/pull/76937)):
    -   `AlertDialog.Root`: moved `intent` prop to `AlertDialog.Popup`;
    -   `AlertDialog.Popup`: moved `onConfirm` prop to `AlertDialog.Root` (now optional; supports async handlers, `{ close: false }` to keep the dialog open, and `{ error: '...' }` to display a built-in error message);
    -   `AlertDialog.Popup`: removed `loading` prop (async flows are now handled internally via `Promise`-returning `onConfirm`);
    -   `AlertDialog.Popup`: made `children` optional in favor of a new `description` prop, which describes the alert dialog semantically.

### New Features

-   Add `Popover` primitive ([#76438](https://github.com/WordPress/gutenberg/pull/76438)).

### Bug Fixes

-   `Card.Title`, `EmptyState.Title`, `EmptyState.Description`: Fix ref and props being lost when a custom `render` element is provided ([#77160](https://github.com/WordPress/gutenberg/pull/77160)).
-   `Tabs.List`: Fix `render` prop being silently discarded ([#77160](https://github.com/WordPress/gutenberg/pull/77160)).
-   `Card`: Set default foreground color on `Card.Root` so content and `currentColor` icons (for example the `CollapsibleCard` chevron) are themeable by default ([#77013](https://github.com/WordPress/gutenberg/pull/77013)).

### Enhancements

-   `Dialog`: Update `Header` layout to support multiple trailing elements alongside the title ([#77161](https://github.com/WordPress/gutenberg/pull/77161), [#77334](https://github.com/WordPress/gutenberg/pull/77334)).
-   `Dialog`: Use `Text` internally for `Dialog.Title`, adopting the `heading-xl` variant for consistent typography ([#77161](https://github.com/WordPress/gutenberg/pull/77161)).
-   `Dialog`, `AlertDialog`, `Tooltip`, `Select`: Add `container` prop to `Popup` for custom portal targets ([#77163](https://github.com/WordPress/gutenberg/pull/77163)).
-   Add defensive styles against global WordPress stylesheets like common.css and forms.css ([#76783](https://github.com/WordPress/gutenberg/pull/76783)).
-   `VisuallyHidden`: Improve Storybook stories and documentation for the `render` prop composition pattern.

### Internal

-   `Card`: Remove redundant `margin: 0` from `Card.Title` now that `Text` applies it by default ([#77187](https://github.com/WordPress/gutenberg/pull/77187)).
-   Normalize `render` prop handling across components and document conventions in `CONTRIBUTING.md` ([#77160](https://github.com/WordPress/gutenberg/pull/77160)).
-   `AlertDialog`: Rewrite internals to use Base UI's `AlertDialog` primitives directly instead of `Dialog` wrappers. Introduces an internal state machine for async confirm flows ([#76937](https://github.com/WordPress/gutenberg/pull/76937)).
-   `Field.Label`, `Fieldset.Legend`, `Field.Details`: Refactor `VisuallyHidden` composition to preserve semantic HTML elements when visually hiding content.
-   `Badge`: Use `Text` component for typography ([#77295](https://github.com/WordPress/gutenberg/pull/77295)).
-   `Notice.ActionLink`: Use `Text` component for typography ([#77332](https://github.com/WordPress/gutenberg/pull/77332)).
-   Update `@base-ui/react` from `1.3.0` to `1.4.0` ([#77308](https://github.com/WordPress/gutenberg/pull/77308)).

## 0.10.0 (2026-04-01)

### New Features

-   Add `AlertDialog` primitive ([#76847](https://github.com/WordPress/gutenberg/pull/76847)).
-   Add `InputControl` component ([#76653](https://github.com/WordPress/gutenberg/pull/76653)).
-   `Dialog`: Expose `initialFocus` and `finalFocus` props on `Dialog.Popup` for custom focus management ([#76860](https://github.com/WordPress/gutenberg/pull/76860)).
-   `CollapsibleCard`: Add `HeaderDescription` subcomponent for supplementary header content with `aria-describedby` relationship ([#76867](https://github.com/WordPress/gutenberg/pull/76867)).

### Bug Fixes

-   `Card`: Add `overflow: clip` to `Card.Root` to prevent child content from overflowing rounded corners ([#76678](https://github.com/WordPress/gutenberg/pull/76678)).
-   `CollapsibleCard`: do not animate the focus ring when expanding/collapsing the card ([#76459](https://github.com/WordPress/gutenberg/pull/76459)).

### Enhancements

-   `Dialog.Root`: expose `disablePointerDismissal` prop ([#76847](https://github.com/WordPress/gutenberg/pull/76847)).
-   `Dialog.Popup`: Default `initialFocus` now deprioritizes the close icon, focusing the first tabbable content element instead (following WAI-ARIA APG guidance) ([#76910](https://github.com/WordPress/gutenberg/pull/76910)).

### Internal

-   Extract `useDeprioritizedInitialFocus` shared hook for reuse across overlay components ([#76910](https://github.com/WordPress/gutenberg/pull/76910)).
-   `Tabs`: Add development-mode validation for Tab/Panel count matching ([#75170](https://github.com/WordPress/gutenberg/pull/75170)).

### TypeScript

-   Remove `NoticeIntent` type from package exports ([#76791](https://github.com/WordPress/gutenberg/pull/76791)).

## 0.9.0 (2026-03-18)

### New Features

-   Add `Text` primitive with predefined typographic variants (`heading-2xl` through `heading-sm`, `body-xl` through `body-sm`) built on design tokens ([#75870](https://github.com/WordPress/gutenberg/pull/75870)).
-   Add `Card` and `CollapsibleCard` primitives ([#76252](https://github.com/WordPress/gutenberg/pull/76252)).
-   Add `Link` primitive ([#76013](https://github.com/WordPress/gutenberg/pull/76013)).
-   Add `Collapsible` primitive ([#76280](https://github.com/WordPress/gutenberg/pull/76280)).

### Bug Fixes

-   `InputLayout.Slot`: Forward the incoming `className` prop instead of letting it be silently overwritten by the rest spread ([#76459](https://github.com/WordPress/gutenberg/pull/76459)).
-   `VisuallyHidden`: Add `word-break: normal` to prevent text wrapping issues in screen reader content ([#75539](https://github.com/WordPress/gutenberg/pull/75539)).

### Enhancements

-   `Badge`: Add border, update text color, and apply `neutral-strong` background to `none` intent for better contrast against neutral surfaces ([#76356](https://github.com/WordPress/gutenberg/pull/76356)).
-   `Dialog`: Use `--wpds-dimension-surface-width-*` design tokens for width constraints ([#76494](https://github.com/WordPress/gutenberg/pull/76494)).
-   `Notice`: Improve narrow layout by letting description and actions span the icon column when a title is present ([#76202](https://github.com/WordPress/gutenberg/pull/76202)).
-   `Notice`: Use `Text` component for `Title` and `Description` typography ([#75870](https://github.com/WordPress/gutenberg/pull/75870)).
-   `Card`: Use `Text` component for `Title` typography ([#76642](https://github.com/WordPress/gutenberg/pull/76642)).
-   `Card`, `CollapsibleCard`: update padding to match legacy `Card` component ([#76368](https://github.com/WordPress/gutenberg/pull/76368)).
-   `CollapsibleCard`: move trigger to the header ([#76265](https://github.com/WordPress/gutenberg/pull/76265)).
-   `CollapsibleCard`: add animations ([#76378](https://github.com/WordPress/gutenberg/pull/76378)).
-   `CollapsibleCard`: allows the browser page search to find and expand the panel contents via the `hiddenUntilFound` prop. ([#76498](https://github.com/WordPress/gutenberg/pull/76498)).

### Internal

-   Update `@base-ui/react` from 1.2.0 to [1.3.0](https://github.com/mui/base-ui/blob/master/CHANGELOG.md#v130) ([#76603](https://github.com/WordPress/gutenberg/pull/76603)).

## 0.8.0 (2026-03-04)

### Breaking Changes

-   `InputLayout`: Remove the `type` prop from `InputLayout.Slot` ([#76011](https://github.com/WordPress/gutenberg/pull/76011)).

### New Features

-   Add `Notice` primitive ([#75981](https://github.com/WordPress/gutenberg/pull/75981)).

### Enhancements

-   `Field.Label`, `Fieldset.Legend`: Add `hideFromVision` prop to visually hide the label while keeping it accessible to screen readers ([#76052](https://github.com/WordPress/gutenberg/pull/76052)).
-   `Dialog`: Add `--wp-ui-dialog-z-index` CSS custom property for legacy z-index compatibility ([#75874](https://github.com/WordPress/gutenberg/pull/75874)).
-   `Tooltip`: Change default `side` from `bottom` to `top`. ([#76131](https://github.com/WordPress/gutenberg/pull/76131)).

### Bug Fixes

-   `IconButton`: Hide tooltip when the button is truly disabled ([#75754](https://github.com/WordPress/gutenberg/pull/75754)).

### Internal

-   Update `@base-ui/react` from 1.0.0 to 1.2.0 ([#75698](https://github.com/WordPress/gutenberg/pull/75698)).
-   `Input`: Align ref type with upstream widening to `HTMLElement` ([#75698](https://github.com/WordPress/gutenberg/pull/75698)).

## 0.7.0 (2026-02-18)

### Breaking Changes

-   Remove `Box` component. Components that previously used `Box` should use the equivalent design tokens in their CSS directly ([#74981](https://github.com/WordPress/gutenberg/issues/74981)).

### New Features

-   Add `Dialog` primitive ([#75183](https://github.com/WordPress/gutenberg/pull/75183)).
-   Add `Tabs` primitive ([#74652](https://github.com/WordPress/gutenberg/pull/74652)).
-   Add `Textarea` primitive ([#74707](https://github.com/WordPress/gutenberg/pull/74707)).

### Bug Fixes

-   `Tabs`: Replace hardcoded font values with design tokens on tab buttons ([#75537](https://github.com/WordPress/gutenberg/pull/75537)).
-   `Field`: Fix default gap spacing ([#75446](https://github.com/WordPress/gutenberg/pull/75446)).
-   `Button`: Fix disabled styles while `focusableWhenDisabled={false}` ([#75568](https://github.com/WordPress/gutenberg/pull/75568)).
-   `IconButton`: make icon always `24px` regardless of `size` prop ([#75677](https://github.com/WordPress/gutenberg/pull/75677)).

### Enhancements

-   `Button`: Add minimum content width (`6ch` + padding) to prevent overly narrow buttons with short labels ([#75133](https://github.com/WordPress/gutenberg/pull/75133)).

### Internal

-   `Button`, `InputLayout`, `Tabs`: use semantic dimension tokens ([#74557](https://github.com/WordPress/gutenberg/pull/74557)).
-   `Button`: Fix overriding of internal CSS variables ([#75568](https://github.com/WordPress/gutenberg/pull/75568)).

## 0.6.0 (2026-01-29)

### New Features

-   Add `Select` primitive ([#74661](https://github.com/WordPress/gutenberg/pull/74661)).

## 0.5.0 (2026-01-16)

### Breaking Changes

-   Remove numeric multiplier option for spacing tokens from `Stack` and `Box` components ([#73852](https://github.com/WordPress/gutenberg/pull/73852), [#74008](https://github.com/WordPress/gutenberg/pull/74008)).

### New Features

-   Add `Stack` component ([#73928](https://github.com/WordPress/gutenberg/pull/73928)).
-   Add `VisuallyHidden` component ([#74189](https://github.com/WordPress/gutenberg/pull/74189)).
-   Add `Field` primitives ([#74190](https://github.com/WordPress/gutenberg/pull/74190)).
-   Add `Fieldset` primitives ([#74296](https://github.com/WordPress/gutenberg/pull/74296)).
-   Add `Icon` component ([#74311](https://github.com/WordPress/gutenberg/pull/74311)).
-   Add `Button` component ([#74415](https://github.com/WordPress/gutenberg/pull/74415), [#74416](https://github.com/WordPress/gutenberg/pull/74416), [#74470](https://github.com/WordPress/gutenberg/pull/74470)).
-   Add `InputLayout` primitive ([#74313](https://github.com/WordPress/gutenberg/pull/74313)).
-   Add `Input` primitive ([#74615](https://github.com/WordPress/gutenberg/pull/74615)).
