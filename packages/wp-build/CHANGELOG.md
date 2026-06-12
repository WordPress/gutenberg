<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 0.16.0 (2026-06-10)

### Bug Fixes

-   Stop the build from crashing when a namespaced import resolves to a package that is not an installed dependency. `getPackageInfo` now returns `null` (honoring its documented contract) instead of throwing, letting the externals plugin fall through to esbuild's own resolution ([#78715](https://github.com/WordPress/gutenberg/pull/78715)).
-   Remove the incorrect `#wpwrap` background from wp-admin critical CSS to prevent a black flash before hydration; rely on the existing `body` background instead ([#78493](https://github.com/WordPress/gutenberg/pull/78493)).
-   Revert the getter-based export replacement in `@wordpress/build` to restore compatibility for affected Gutenberg 23.0 builds ([#78917](https://github.com/WordPress/gutenberg/pull/78917)).

## 0.15.0 (2026-05-27)

### Bug Fixes

-   Defer single-page admin `import( "@wordpress/boot" )` until `DOMContentLoaded` so the boot module evaluates after classic script dependencies have loaded ([#78136](https://github.com/WordPress/gutenberg/pull/78136)).

## 0.14.0 (2026-05-14)

### Enhancements

-   Replace getter-based `wp.*` exports with data properties for faster property access ([#78303](https://github.com/WordPress/gutenberg/pull/78303)).

### Bug Fixes

-   Register generated CSS module styles with `@wordpress/style-runtime` so they can be injected into registered documents, such as editor iframes ([#77965](https://github.com/WordPress/gutenberg/pull/77965)).
-   Guard `require_once` calls in generated PHP files against deployment race conditions ([#78110](https://github.com/WordPress/gutenberg/pull/78110)).

## 0.13.0 (2026-04-29)

### Bug Fixes

-   Update the optional `@wordpress/boot`, `@wordpress/route`, and `@wordpress/theme` peer dependency ranges to avoid blocking newer compatible package versions ([#77568](https://github.com/WordPress/gutenberg/pull/77568)).

## 0.12.0 (2026-04-15)

## 0.11.0 (2026-04-01)

### Bug Fixes

-   Derive `data-wp-hash` from the transformed CSS instead of the raw source to prevent style mismatches when multiple build pipelines process the same source file ([#76743](https://github.com/WordPress/gutenberg/pull/76743)).

## 0.10.0 (2026-03-18)

### Breaking Changes

-   `@wordpress/boot`, `@wordpress/route`, `@wordpress/theme`, and `@wordpress/private-apis` are no longer bundled. They are now expected to be provided by WordPress Core (7.0+) or the Gutenberg plugin.

### Enhancements

-   Avoid unexpected results when typecasting `IS_GUTENBERG_PLUGIN` and `IS_WORDPRESS_CORE` values to Booleans ([#75844](https://github.com/WordPress/gutenberg/pull/75844)).
-   Skip PHP transforms during builds when building for WordPress Core ([#75844](https://github.com/WordPress/gutenberg/pull/75844)).

## 0.9.0 (2026-03-04)

## 0.8.0 (2026-02-18)

## 0.7.0 (2026-01-29)

-   Update documentation to describe `wpPlugin.name`
-   Add `wpWorkers` field support for automatic worker bundling ([#74785](https://github.com/WordPress/gutenberg/pull/74785)).
-   Add WASM inlining plugin for bundling WebAssembly modules.

## 0.6.0 (2026-01-16)

### Breaking Changes

-   Renamed generated PHP files to avoid `index.php` naming conflicts:
    -   `build/index.php` → `build/build.php`
    -   `build/modules/index.php` → `build/modules/registry.php`
    -   `build/scripts/index.php` → `build/scripts/registry.php`
    -   `build/styles/index.php` → `build/styles/registry.php`
    -   `build/routes/index.php` → `build/routes/registry.php`
-   All generated page functions now include the `{{PREFIX}}` (from `wpPlugin.name`) at the beginning:
    -   `register_my_page_route()` → `my_plugin_register_my_page_route()`
    -   `my_page_render_page()` → `my_plugin_my_page_render_page()`
    -   And similarly for all other page functions
-   Route registration now uses named functions instead of anonymous closures, allowing third-party developers to unhook them

## 0.4.0 (2025-11-26)

## 0.3.0 (2025-11-12)

## 0.2.0 (2025-10-29)

### New Features

-   Initial release of `@wordpress/build` package
-   Transpilation support for TypeScript/JSX to CommonJS and ESM formats
-   SCSS and CSS modules compilation with LTR and RTL support
-   WordPress script and module bundling
-   Automatic PHP registration file generation
-   Watch mode for development
