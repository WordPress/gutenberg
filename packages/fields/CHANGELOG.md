<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Enhancements

-   Show a "Privacy Policy Page" badge next to the title of the page assigned in Settings > Privacy, alongside the existing "Homepage" and "Posts Page" badges ([#82422](https://github.com/WordPress/gutenberg/pull/82422)).
-   Append an ellipsis (`…`) to the labels of the actions that open a dialog requiring further input or confirmation (`Delete…`, `Trash…`, `Permanently delete…`, `Rename…`, `Duplicate…`, `Reset…`, `Order…`), following the menu ellipsis guideline. The dialog titles keep the ellipsis-free wording. ([#81994](https://github.com/WordPress/gutenberg/pull/81994))

### Bug Fixes

-   Hide the slug field for posts without a permalink, such as posts of non-public post types, matching the classic post URL panel ([#82341](https://github.com/WordPress/gutenberg/pull/82341)).
-   Normalize special characters in exported pattern filenames to prevent broken or unreadable files. ([#77033](https://github.com/WordPress/gutenberg/pull/77033))

### Internal

-   `MediaEdit`: Space `ValidityIndicator` with `Stack` now that the indicator has no outer margin. ([#82267](https://github.com/WordPress/gutenberg/pull/82267))
-   Remove the template activation (`active_templates`) experiment checks from the rename, reset, and duplicate actions ([#82241](https://github.com/WordPress/gutenberg/pull/82241)).
-   Remove unused dependencies `@wordpress/hooks`, `@wordpress/primitives`, `@wordpress/router`, etc. ([#82103](https://github.com/WordPress/gutenberg/pull/82103)).
-   Update a source reference after its JSX file moved to the `.jsx` extension ([#80990](https://github.com/WordPress/gutenberg/pull/80990)).
-   Remove tsconfig project references to packages that are not dependencies ([#82106](https://github.com/WordPress/gutenberg/pull/82106)).

## 0.46.0 (2026-08-26)

### Enhancements

-   Export `build-style/*`, so the stylesheet can be imported as `@wordpress/fields/build-style/style.css` [#81769](https://github.com/WordPress/gutenberg/pull/81769)).

### Internal

-   Split tsconfig into a build project and a default dev project so dev files are type checked without publishing their declarations. ([#81516](https://github.com/WordPress/gutenberg/pull/81516))
-   Point tsconfig references at split dependencies' build projects. ([#81509](https://github.com/WordPress/gutenberg/pull/81509), [#81514](https://github.com/WordPress/gutenberg/pull/81514), [#81515](https://github.com/WordPress/gutenberg/pull/81515))
-   `parent`: Narrow the combobox `onChange` handler parameter to `string | null`, following the upstream `ComboboxControl` type fix that removed the accidental `undefined` from the callback type. ([#81568](https://github.com/WordPress/gutenberg/pull/81568))
-   `CreateTemplatePartModal`: Migrate the `utils` helpers to TypeScript. ([#81808](https://github.com/WordPress/gutenberg/pull/81808))
-   `MediaEdit`: Render the validity message with `ValidityIndicator` from `@wordpress/ui` instead of hand-rolled markup styled by `@wordpress/components` global class names. The valid state now shows the success icon rather than the error icon. ([#81230](https://github.com/WordPress/gutenberg/issues/81230)) ([#81574](https://github.com/WordPress/gutenberg/pull/81574))

## 0.45.0 (2026-08-12)

### Bug Fixes

-   `MediaEdit`: Decode HTML entities when displaying attachment titles. ([#81269](https://github.com/WordPress/gutenberg/pull/81269))

### Internal

-   Remove obsolete dependency grouping comments as part of the repository-wide separator-free import migration. ([#81248](https://github.com/WordPress/gutenberg/pull/81248))

## 0.44.0 (2026-07-29)

## 0.43.0 (2026-07-14)

### Enhancements

-   `Slug`: Use the emphasis font-weight token for help text ([#80093](https://github.com/WordPress/gutenberg/pull/80093)).

-   Widen React peer dependency ranges to `^18 || ^19` to support both React 18 and React 19 environments ([#80024](https://github.com/WordPress/gutenberg/pull/80024)).

-   `MediaEdit`: Update validation error message to be announced by screen readers. ([#79600](https://github.com/WordPress/gutenberg/pull/79600))

## 0.42.0 (2026-07-01)

## 0.41.0 (2026-06-24)

## 0.40.1 (2026-06-16)

## 0.40.0 (2026-06-10)

### Code Quality

-   Add missing `@types/react` dependency. [#78882](https://github.com/WordPress/gutenberg/pull/78882).

### Internal

-   Migrate `Tooltip` consumers from `@wordpress/components` to the new compositional `Tooltip` in `@wordpress/ui` ([#78691](https://github.com/WordPress/gutenberg/pull/78691)).

## 0.39.0 (2026-05-27)

## 0.38.0 (2026-05-14)

## 0.37.0 (2026-04-29)

## 0.36.0 (2026-04-15)

## 0.35.0 (2026-04-01)

## 0.34.0 (2026-03-18)

## 0.33.0 (2026-03-04)

## 0.32.0 (2026-02-18)

## 0.31.0 (2026-01-29)

## 0.30.0 (2026-01-16)

## 0.28.0 (2025-11-26)

## 0.27.0 (2025-11-12)

## 0.26.0 (2025-10-29)

## 0.25.0 (2025-10-17)

## 0.24.0 (2025-10-01)

## 0.23.0 (2025-09-17)

## 0.22.0 (2025-09-03)

### Enhancements

-   Update the base `titleField` to enable hiding. [#71369](https://github.com/WordPress/gutenberg/pull/71369)

## 0.21.0 (2025-08-20)

## 0.20.0 (2025-08-07)

## 0.19.0 (2025-07-23)

## 0.18.0 (2025-06-25)

## 0.17.0 (2025-06-04)

## 0.16.0 (2025-05-22)

## 0.15.0 (2025-05-07)

## 0.14.0 (2025-04-11)

## 0.13.0 (2025-03-27)

## 0.12.0 (2025-03-13)

## 0.11.0 (2025-02-28)

## 0.10.0 (2025-02-12)

## 0.9.0 (2025-01-29)

## 0.8.0 (2025-01-15)

## 0.7.0 (2025-01-02)

## 0.6.0 (2024-12-11)

## 0.5.0 (2024-11-27)

## 0.4.0 (2024-11-16)

## 0.3.0 (2024-10-30)

## 0.2.0 (2024-10-16)

## 0.1.0 (2024-10-03)

Initial release.
