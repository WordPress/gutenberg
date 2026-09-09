<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Internal

-   Remove unused dependency `@wordpress/date` ([#82103](https://github.com/WordPress/gutenberg/pull/82103)).
-   Remove tsconfig project references to packages that are not dependencies ([#82106](https://github.com/WordPress/gutenberg/pull/82106)).

## 0.17.0 (2026-08-26)

### Enhancements

-   `MediaEditor`: replace `ComplementaryArea` and `InterfaceSkeleton` with a layout the media editor owns, and widen the settings panel so its controls and fields are not so cramped ([#81840](https://github.com/WordPress/gutenberg/pull/81840)).
-   `MediaEditor.ImageControls` is removed, and `renderFrame` drops `hasCanvas`. Both were added in the same unreleased cycle: the transform controls belong to the Crop panel, and `HistoryActions` already renders nothing when a panel covers the canvas, so a frame gating on it repeated that check from the outside. The `scope` prop is removed too: it named an `@wordpress/interface` scope that persisted the panel's open state, which went with `ComplementaryArea` ([#81840](https://github.com/WordPress/gutenberg/pull/81840)).
-   Expose the header, history (reset/undo/redo), save (cancel/save) and image control clusters as `MediaEditor` sub-components, so each frame imports and arranges them to suit its own chrome. `renderFrame` now passes data only: `footerActions` is gone, `footerLayout` is now `layout`, and `isImage` is new. `showCloseButton` moves from `MediaEditor` to `MediaEditor.HeaderActions` ([#81563](https://github.com/WordPress/gutenberg/pull/81563)).

### Bug Fixes

-   `MediaEditor`: make the Details fields reachable below the `small` breakpoint. `ComplementaryArea` closed the sidebar on small viewports and offered no way to re-open it, so the fields could not be edited on a phone at all ([#81840](https://github.com/WordPress/gutenberg/pull/81840)).
-   Keep the Details sidebar from clipping focus outlines, with balanced horizontal padding ([#81703](https://github.com/WordPress/gutenberg/pull/81703)).
-   Keep initial focus on the modal dialog frame instead of moving it to the crop area once the image loads ([#81541](https://github.com/WordPress/gutenberg/pull/81541)).

### Internal

-   Split tsconfig into a build project and a default dev project so dev files are type checked without publishing their declarations. ([#81514](https://github.com/WordPress/gutenberg/pull/81514))

## 0.16.0 (2026-08-12)

## 0.15.0 (2026-07-29)

## 0.14.0 (2026-07-14)

### Enhancements

-   Use the emphasis font-weight token for UI emphasis ([#80093](https://github.com/WordPress/gutenberg/pull/80093)).
-   Widen React peer dependency ranges to `^18 || ^19` to support both React 18 and React 19 environments ([#80024](https://github.com/WordPress/gutenberg/pull/80024)).

-   `useAriaAnnouncer`: Update to use `speak` for screen reader announcements instead of an inline `aria-live` region. ([#79600](https://github.com/WordPress/gutenberg/pull/79600))

## 0.13.0 (2026-07-01)

## 0.12.0 (2026-06-24)

## 0.11.1 (2026-06-16)

## 0.11.0 (2026-06-10)

### Bug Fixes

-   Media Editor: Stop the details/crop sidebar overflowing the modal between the small and medium breakpoints.
-   Media Editor: Remove the lag when toggling the details/crop sidebar open or closed.

### Code Quality

-   Add missing `@types/react` dependency. [#78882](https://github.com/WordPress/gutenberg/pull/78882).
