<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### Enhancements

-   Widen React peer dependency ranges to `^18 || ^19` to support both React 18 and React 19 environments ([#80024](https://github.com/WordPress/gutenberg/pull/80024)).

### Internal

-   Replace `@wordpress/components` layout, text, link, and text-input components in `ConnectorItem` and the default settings forms with their recommended `@wordpress/ui` equivalents (`Stack`, `Text`, `Link`, `InputControl`). The rendered markup no longer carries the `components-*` class names of the replaced components.
-   Add missing `@types/react` dependency. [#78882](https://github.com/WordPress/gutenberg/pull/78882).
-   Split tsconfig into a build project and a default dev project so dev files are type checked without publishing their declarations. ([#81514](https://github.com/WordPress/gutenberg/pull/81514))
