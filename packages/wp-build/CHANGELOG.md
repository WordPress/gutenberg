<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 0.7.0 (2026-01-29)

- Update documentation to describe `wpPlugin.name`
- Add `wpWorkers` field support for automatic worker bundling ([#74785](https://github.com/WordPress/gutenberg/pull/74785)).
- Add WASM inlining plugin for bundling WebAssembly modules.

## 0.6.0 (2026-01-16)

### Breaking Changes

- Renamed generated PHP files to avoid `index.php` naming conflicts:
  - `build/index.php` → `build/build.php`
  - `build/modules/index.php` → `build/modules/registry.php`
  - `build/scripts/index.php` → `build/scripts/registry.php`
  - `build/styles/index.php` → `build/styles/registry.php`
  - `build/routes/index.php` → `build/routes/registry.php`
- All generated page functions now include the `{{PREFIX}}` (from `wpPlugin.name`) at the beginning:
  - `register_my_page_route()` → `my_plugin_register_my_page_route()`
  - `my_page_render_page()` → `my_plugin_my_page_render_page()`
  - And similarly for all other page functions
- Route registration now uses named functions instead of anonymous closures, allowing third-party developers to unhook them

## 0.4.0 (2025-11-26)

## 0.3.0 (2025-11-12)

## 0.2.0 (2025-10-29)

### New Features

- Initial release of `@wordpress/build` package
- Transpilation support for TypeScript/JSX to CommonJS and ESM formats
- SCSS and CSS modules compilation with LTR and RTL support
- WordPress script and module bundling
- Automatic PHP registration file generation
- Watch mode for development
