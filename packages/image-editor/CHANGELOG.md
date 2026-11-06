<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

Initial release ([#86223](https://github.com/WordPress/gutenberg/pull/86223)).

### Enhancements

-   Allow consumers to theme the canvas through CSS custom properties ([#86340](https://github.com/WordPress/gutenberg/pull/86340)).
-   Add `exportImage( state, options? )`, which exports the edited image as a `Blob` in the browser ([#86405](https://github.com/WordPress/gutenberg/pull/86405)).

### Bug Fixes

-   Compare only the public edit fields when checking whether two image editor states are equal ([#86286](https://github.com/WordPress/gutenberg/pull/86286)).
-   Fit a supplied crop to its locked ratio before `useImageEditor` exposes it or applies an edit ([#86286](https://github.com/WordPress/gutenberg/pull/86286)).
-   Restore maximum locked crops and panned positions through quarter turns ([#86286](https://github.com/WordPress/gutenberg/pull/86286)).
