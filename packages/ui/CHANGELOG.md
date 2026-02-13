<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Breaking Changes

-   Remove `Box` component. Components that previously used `Box` should use the equivalent design tokens in their CSS directly ([#74981](https://github.com/WordPress/gutenberg/issues/74981)).

### New Features

-   Add `Dialog` primitive ([#75183](https://github.com/WordPress/gutenberg/pull/75183)).
-   Add `Tabs` primitive ([#74652](https://github.com/WordPress/gutenberg/pull/74652)).
-   Add `Textarea` primitive ([#74707](https://github.com/WordPress/gutenberg/pull/74707)).

### Bug Fixes

-   `Field`: Fix default gap spacing ([#75446](https://github.com/WordPress/gutenberg/pull/75446)).

### Enhancements

-   `Button`: Add minimum content width (`6ch` + padding) to prevent overly narrow buttons with short labels ([#75133](https://github.com/WordPress/gutenberg/pull/75133)).

### Internal

-   `Button`, `InputLayout`, `Tabs`: use semantic dimension tokens ([#74557](https://github.com/WordPress/gutenberg/pull/74557)).

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
