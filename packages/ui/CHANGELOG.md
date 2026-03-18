<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

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
-   `Card`, `CollapsibleCard`: update padding to match legacy `Card` component ([#76368](https://github.com/WordPress/gutenberg/pull/76368)).
-   `CollapsibleCard`: move trigger to the header ([#76265](https://github.com/WordPress/gutenberg/pull/76265)).
-   `CollapsibleCard`: add animations ([#76378](https://github.com/WordPress/gutenberg/pull/76378)).
-   `CollapsibleCard`: allows the browser page search to find and expand the panel contents via the `hiddenUntilFound` prop. ([#76498](https://github.com/WordPress/gutenberg/pull/76498)).

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
