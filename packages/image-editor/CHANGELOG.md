<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Features

-   Add `applyImageEdit( state, edit, options? )`, which turns an `ImageEdit` into an editor state, fitting the crop to the image as the editor does unless `strict` is set ([#86665](https://github.com/WordPress/gutenberg/pull/86665)).

### Bug Fixes

-   `getImageEdit` and `getOutputSize` return a value within a millionth of a whole number as that number, instead of floating-point noise such as `1439.9999999999998` ([#87376](https://github.com/WordPress/gutenberg/pull/87376)).

### Internal

-   Update Storybook development dependencies to 10.6.8 ([#87255](https://github.com/WordPress/gutenberg/pull/87255)).
-   Update `vitest` development dependency to 5.1.1 ([#87254](https://github.com/WordPress/gutenberg/pull/87254)).

## 0.1.0 (2026-11-18)

Initial release ([#86223](https://github.com/WordPress/gutenberg/pull/86223)).

### Enhancements

-   Follow WordPress Design System colours and spacing by default when its tokens are present, while keeping standalone defaults and consumer overrides ([#86402](https://github.com/WordPress/gutenberg/pull/86402)).
-   Allow consumers to theme the canvas through CSS custom properties ([#86340](https://github.com/WordPress/gutenberg/pull/86340)).
-   Add `exportImage( state, options? )`, which exports the edited image as a `Blob` in the browser ([#86405](https://github.com/WordPress/gutenberg/pull/86405)).
-   Describe the edit to apply when saving as one `ImageEdit` record, returned by `getImageEdit( state )` ([#86630](https://github.com/WordPress/gutenberg/pull/86630)).
-   Add `mapImageEdit( edit, handlers )`, which turns each part of an `ImageEdit` into the consumer's own format in the order the parts apply ([#86704](https://github.com/WordPress/gutenberg/pull/86704)).

### Bug Fixes

-   Compare only the public edit fields when checking whether two image editor states are equal ([#86286](https://github.com/WordPress/gutenberg/pull/86286)).
-   Fit a supplied crop to its locked ratio before `useImageEditor` exposes it or applies an edit ([#86286](https://github.com/WordPress/gutenberg/pull/86286)).
-   Restore maximum locked crops and panned positions through quarter turns ([#86286](https://github.com/WordPress/gutenberg/pull/86286)).
-   Announce the crop size that the resize tooltip shows, so the two agree on a nearly full crop ([#86487](https://github.com/WordPress/gutenberg/pull/86487)).

### Internal

-   Update the Storybook development dependencies to 10.6.6 ([#86507](https://github.com/WordPress/gutenberg/pull/86507)).
-   Update the Vitest development dependency to 5.1.0 ([#86509](https://github.com/WordPress/gutenberg/pull/86509)).
