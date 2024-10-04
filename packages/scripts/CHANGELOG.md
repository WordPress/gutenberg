<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 30.1.0 (2024-10-03)

## 30.0.0 (2024-09-19)


### Breaking Changes

-   Updated `stylelint` dependency to `^16.8.2` ([#64828](https://github.com/WordPress/gutenberg/pull/64828)).
-   Switched default config from `@wordpress/stylelint-config/scss` to use `@wordpress/stylelint-config/scss-stylistic` to keep stylistic rules ([#64828](https://github.com/WordPress/gutenberg/pull/64828)).

## 29.0.0 (2024-09-05)

### Breaking Changes

-   Fixed the issue with having 5 high severity vulnerabilities by upgrading the `puppeteer-core` package to the latest major version `^23.1.0` ([#64597](https://github.com/WordPress/gutenberg/pull/64597)).

### Enhancements

- Inlines CSS files imported from other CSS files before optimization in the `build` command ([#61121](https://github.com/WordPress/gutenberg/pull/61121)).

### Bug Fixes

-   Added chunk filename in webpack config to avoid reading stale files ([#58176](https://github.com/WordPress/gutenberg/pull/58176)).

## 28.6.0 (2024-08-21)

## 28.5.0 (2024-08-07)

## 28.4.0 (2024-07-24)

### New Features

-   Update webpack configuration for the `build` and `start` commands to automatically copy PHP files listed in the `variations` field of `block.json` files from the source to the build folder ([#63098](https://github.com/WordPress/gutenberg/pull/63098)).

## 28.3.0 (2024-07-10)

## 28.2.0 (2024-06-26)

## 28.1.0 (2024-06-15)

## 28.0.0 (2024-05-31)

### Breaking Changes

**Note** If you're using @wordpress/scripts for building JS scripts to target WordPress 6.5 or earlier, you should not upgrade to this version and continue using @wordpress/scripts@27.

-   Use React's automatic runtime to transform JSX ([#61692](https://github.com/WordPress/gutenberg/pull/61692)).
-   Variables like `process.env.IS_GUTENBERG_PLUGIN` have been replaced by `globalThis.IS_GUTENBERG_PLUGIN`. Build systems using `process.env` should be updated ([#61486](https://github.com/WordPress/gutenberg/pull/61486)).
-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 27.9.0 (2024-05-16)

### New Features

-   Add RTL support when building CSS styles with `build` and `start` scripts ([#61540](https://github.com/WordPress/gutenberg/pull/61540)).

## 27.8.0 (2024-05-02)

## 27.7.0 (2024-04-19)

## 27.6.0 (2024-04-03)

## 27.5.0 (2024-03-21)

## 27.4.0 (2024-03-06)

## 27.3.0 (2024-02-21)

## 27.2.0 (2024-02-09)

### New Features

-   Add experimental support for `viewScriptModule` field in block.json for `build` and `start` scripts ([#57437](https://github.com/WordPress/gutenberg/pull/57437)).

### Enhancements

-   Ensure that watched module builds detect block.json changes ([#57927](https://github.com/WordPress/gutenberg/pull/57927)).

### Deprecations

-   Experimental support for `viewModule` field in block.json is deprecated in favor of `viewScriptModule` ([#57437](https://github.com/WordPress/gutenberg/pull/57437)).

## 27.1.0 (2024-01-24)

## 27.0.0 (2024-01-10)

### New Features

-   Add experimental support for `viewModule` field in block.json for `build` and `start` scripts ([#57461](https://github.com/WordPress/gutenberg/pull/57461)).

### Breaking Changes

-   Drop support for Node.js versions < 18.

## 26.19.0 (2023-12-13)

### Bug Fixes

-   Fix CSS imports not minified ([#56516](https://github.com/WordPress/gutenberg/pull/56516)).

## 26.18.0 (2023-11-29)

### Internal

-   The bundled `jest-dev-server` dependency has been updated from `^6.0.2` to `^9.0.1` ([#33287](https://github.com/WordPress/gutenberg/pull/33287)).

## 26.17.0 (2023-11-16)

## 26.16.0 (2023-11-02)

## 26.15.0 (2023-10-18)

## 26.14.0 (2023-10-05)

### Internal

-   The bundled `@pmmmwh/react-refresh-webpack-plugin` dependency has been updated from requiring `^0.5.2` to requiring `^0.5.11` ([#54657](https://github.com/WordPress/gutenberg/pull/54657)).
-   The bundled `browserslist` dependency has been updated from requiring `^4.21.9` to requiring `^4.21.10` ([#54657](https://github.com/WordPress/gutenberg/pull/54657)).
-   The bundled `react-refresh` dependency has been updated from requiring `^0.10.0` to requiring `^0.14.0` ([#54657](https://github.com/WordPress/gutenberg/pull/54657)).
-   The bundled `webpack` dependency has been updated from requiring `^5.47.1` to requiring `^5.88.2` ([#54657](https://github.com/WordPress/gutenberg/pull/54657)).
-   The bundled `webpack-bundle-analyzer` dependency has been updated from requiring `^4.4.2` to requiring `^4.9.1` ([#54657](https://github.com/WordPress/gutenberg/pull/54657)).
-   The bundled `webpack-cli` dependency has been updated from requiring `^4.9.1` to requiring `^5.1.4` ([#54657](https://github.com/WordPress/gutenberg/pull/54657)).
-   The bundled `webpack-dev-server` dependency has been updated from requiring `^4.4.0` to requiring `^4.15.1` ([#54657](https://github.com/WordPress/gutenberg/pull/54657)).

## 26.13.0 (2023-09-20)

### Enhancements

-   Added support for `test-playwright` script ([#53108](https://github.com/WordPress/gutenberg/pull/53108)).
-   The bundled `wp-prettier` dependency has been upgraded from `2.8.5` to `3.0.3` ([#54539](https://github.com/WordPress/gutenberg/pull/54539)).

### Bug Fixes

-   Correctly resolve entry points when the directory is symlinked ([#54212](https://github.com/WordPress/gutenberg/pull/54212)).

## 26.12.0 (2023-08-31)

## 26.11.0 (2023-08-16)

### Enhancements

-   Updated `npm-package-json-lint` peer dependency to require v6.0.0 [#53636](https://github.com/WordPress/gutenberg/pull/53636).
-   The bundled `@svgr/webpack` dependency has been updated from requiring ^6.2.1 to requiring ^8.0.1 ([#53630](https://github.com/WordPress/gutenberg/pull/53630)).
-   The bundled `cssnano` dependency has been updated from requiring ^5.07 to requiring ^6.0.1 ([#53630](https://github.com/WordPress/gutenberg/pull/53630)).

### Bug Fixes

-   Fix prevent watch mode from aborting when encountering a `block.json` file that contains invalid JSON. ([#51971](https://github.com/WordPress/gutenberg/pull/51971))

## 26.10.0 (2023-08-10)

## 26.9.0 (2023-07-20)

## 26.8.0 (2023-07-05)

## 26.7.0 (2023-06-23)

## 26.6.0 (2023-06-07)

### Enhancements

-   The bundled `terser-webpack-plugin` dependency has been updated from requiring `^5.1.4` to requiring `^5.3.9` ([#50994](https://github.com/WordPress/gutenberg/pull/50994)).
-   Optimize updating render paths when developing blocks with the `start` command ([#51162](https://github.com/WordPress/gutenberg/pull/51162)).

### Bug Fixes

-   Ensure files listed in `render` field of `block.json` files are always copied to the build folder when using the `start` command ([#50939](https://github.com/WordPress/gutenberg/pull/50939)).

## 26.5.0 (2023-05-24)

## 26.4.0 (2023-05-10)

## 26.3.0 (2023-04-26)

### Enhancements

-   License check script supports conjunctive (AND) licenses ([46801](https://github.com/WordPress/gutenberg/pull/46801)).

## 26.2.0 (2023-04-12)

## 26.1.0 (2023-03-29)

### Enhancements

-   The bundled `wp-prettier` dependency has been upgraded from `2.6.2` to `2.8.5` ([#49258](https://github.com/WordPress/gutenberg/pull/49258)).

## 26.0.0 (2023-03-15)

### Breaking Changes

-   Started using Jest v29 instead of v27 as a dependency. See [breaking changes in Jest 28](https://jestjs.io/blog/2022/04/25/jest-28) and [in jest 29](https://jestjs.io/blog/2022/08/25/jest-29) ([#47388](https://github.com/WordPress/gutenberg/pull/47388))

## 25.5.1 (2023-03-06)

### Bug Fixes

-   Fix `render.php` isn't copied in Windows OS ([#48735](https://github.com/WordPress/gutenberg/pull/48735)).

## 25.5.0 (2023-03-01)

## 25.4.0 (2023-02-15)

### New Features

-   The `WP_DEVTOOL` environment variable can now be used to set the Webpack devtool option for sourcemaps in production builds ([#46812](https://github.com/WordPress/gutenberg/pull/46812)). Previously, this only worked for development builds.
-   Update default webpack config and lint-style script to allow PostCSS (`.pcss` extension) file usage ([#45352](https://github.com/WordPress/gutenberg/pull/45352)).
-   Add `--no-watch` option to allow creating the unminified/dev JS without starting the watcher ([#44237](https://github.com/WordPress/gutenberg/pull/44237)).

## 25.3.0 (2023-02-01)

## 25.2.0 (2023-01-11)

## 25.1.0 (2023-01-02)

## 25.0.0 (2022-12-14)

### Breaking Changes

-   Updated dependencies to require React 18 ([45235](https://github.com/WordPress/gutenberg/pull/45235))

## 24.6.0 (2022-11-16)

## 24.5.0 (2022-11-02)

## 24.4.0 (2022-10-19)

## 24.3.0 (2022-10-05)

## 24.2.0 (2022-09-21)

## 24.1.0 (2022-09-13)

### New Features

-   Update the default webpack config to allow `webp` image format ([#43880](https://github.com/WordPress/gutenberg/pull/43880)).
-   Update webpack configuration for the `build` and `start` commands to automatically copy PHP files listed in the `render` field of `block.json` files from the source to the build folder ([#43917](https://github.com/WordPress/gutenberg/pull/43917)).

## 24.0.0 (2022-08-24)

### Breaking Changes

-   Increase the minimum Node.js version to 14 and minimum npm version to 6.14.4 ([#43141](https://github.com/WordPress/gutenberg/pull/43141)).
-   The bundled `@wordpress/eslint-plugin` package got updated to the new major version and the default linting for Jest unit tests is now handled in the default config in this package ([#43272](https://github.com/WordPress/gutenberg/pull/43272)).

### Bug Fixes

-   Packages: Replace `is-plain-obj` with `is-plain-object` ([#43511](https://github.com/WordPress/gutenberg/pull/43511)).

## 23.7.2 (2022-08-17)

### Bug Fixes

-   Jest Preset: Improve `is-plain-obj` transformation ignore ([#43271](https://github.com/WordPress/gutenberg/pull/43271)).

## 23.7.1 (2022-08-12)

### Bug Fixes

-   Jest Preset: Ignore `is-plain-obj` transformation ([#43179](https://github.com/WordPress/gutenberg/pull/43179)).

## 23.6.0 (2022-07-27)

### Bug Fixes

-   Fix the incorrect exit error code when status missing in `webpack` call for `build` and `start` commands ([#42396](https://github.com/WordPress/gutenberg/pull/42396)).

## 23.3.0 (2022-06-15)

### Enhancements

-   The bundled `wp-prettier` dependency has been upgraded from `2.2.1` to `2.6.2` ([#40542](https://github.com/WordPress/gutenberg/pull/40542)).

## 23.2.0 (2022-06-01)

### Bug Fixes

-   Fix incorrect handling in `plugin-zip` for root-level files and some specific platform conditions ([#41439](https://github.com/WordPress/gutenberg/pull/41439)).

## 23.1.0 (2022-05-18)

### New Features

-   Enable by default code formatting for JSON files in the `format` command ([#40994](https://github.com/WordPress/gutenberg/pull/40994)). You can opt-out of this behavior by providing a custom file matcher, example: `wp-scripts format src/**/*.js`.
-   Support tsx files in `viewScript`, `script`, `editorScript` ([#41068](https://github.com/WordPress/gutenberg/pull/41068)).

### Bug Fixes

-   Fix: env unit test fails on Windows ([#41070](https://github.com/WordPress/gutenberg/pull/41070))

## 23.0.0 (2022-05-04)

### Breaking Changes

-   Remove `lint-md-js` script that was broken for some time and it's extemely hard to make it work correctly with the recommended ESLint config in Markdown files ([#40511](https://github.com/WordPress/gutenberg/pull/40511)).
-   Remove the previously deprecated and undocumented `format-js` command ([#40512](https://github.com/WordPress/gutenberg/pull/40512)). You should use the `format` command instead.

### New Features

-   Add `--dist-tag` flag to the `packages-update` command to allow specifying a custom dist-tag when updating npm packages ([#40514](https://github.com/WordPress/gutenberg/pull/

## 22.5.0 (2022-04-21)

### Bug Fixes

-   Update `markdownlint` and `markdownlint-cli` to the latest versions ([#40479](https://github.com/WordPress/gutenberg/pull/40479)).

## 22.4.0 (2022-04-08)

### New Features

-   Add `--webpack-src-dir` CLI flag to allow customizing the source code directory (`src` by default) ([#39618](https://github.com/WordPress/gutenberg/pull/39618)).

### Bug Fixes

-   Add `vendor/` to `.markdownlintignore`, to match `lint-md-docs` docs ([#39724](https://github.com/WordPress/gutenberg/pull/39724)).
-   Include files with `.jsx` extension in the build process ([#39613](https://github.com/WordPress/gutenberg/pull/39613)).
-   Ensure that the default logic for entry points in the build commands is executed only when used the default config ([#39618](https://github.com/WordPress/gutenberg/pull/39618)).

## 22.2.0 (2022-03-11)

### Enhancements

-   The bundled `@wordpress/eslint-plugin` package got updated to the new major version, but the breaking changes included don't affect this package ([#39244](https://github.com/WordPress/gutenberg/pull/39244)).

## 22.1.0 (2022-03-03)

### New Features

-   Add `--webpack-copy-php` CLI flag to opt-in to copying php files from `src` and its subfolders to the output directory (`build` by default) ([#39171](https://github.com/WordPress/gutenberg/pull/39171)).

## 22.0.0 (2022-02-22)

### Breaking Changes

-   The bundled `@svgr/webpack` dependency has been updated from requiring `^5.5.0` to requiring `^6.2.1` ([#38866](https://github.com/WordPress/gutenberg/pull/38866)). See [official migration guide to v6](https://react-svgr.com/docs/migrate/) for details.

### New Features

-   Automatically copy PHP files located in the `src` folder and its subfolders to the output directory (`build` by default) ([#38715](https://github.com/WordPress/gutenberg/pull/38715)).

## 21.0.2 (2022-02-15)

-   Entry points are not detected in Windows OS ([#38781](https://github.com/WordPress/gutenberg/pull/38781)).

## 21.0.1 (2022-02-11)

### Bug Fixes

-   Return a default entry object in the `build` command when no entry files discovered in the project ([#38737](https://github.com/WordPress/gutenberg/pull/38737)).

## 21.0.0 (2022-02-10)

### Breaking Changes

-   The bundled `puppeteer-core` dependency has been updated from requiring `^11.0.0` to requiring `^13.2.0` ([#37078](https://github.com/WordPress/gutenberg/pull/37078)).

### Bug Fixes

-   Fix the handling for entry points when running `build` command ([#38584](https://github.com/WordPress/gutenberg/pull/38584)).

## 20.0.2 (2022-01-31)

### Bug Fixes

-   Fix the `build` command that does not generate assets on Windows OS ([#38348](https://github.com/WordPress/gutenberg/pull/38348)).
-   Adds fallback to `src/index.js` when no valid scripts discovered in metadata files when running the `build` command ([#38367](https://github.com/WordPress/gutenberg/pull/38367)).

## 20.0.1 (2022-01-28)

### Bug Fixes

-   Ensure that React Fast Refresh is not wired when it isn't explicitly enabled with `--hot` CLI argument when running the `start` command.

## 20.0.0 (2022-01-27)

### Breaking Changes

-   The bundled `eslint` dependency has been updated from requiring `^7.17.0` to requiring `^8.3.0` ([#36283](https://github.com/WordPress/gutenberg/pull/36283)).
-   The `puppeteer-core` dependency has been updated from requiring `^10.1.0` to requiring `^11.0.0` (see [Breaking Changes](https://github.com/puppeteer/puppeteer/releases/tag/v11.0.0), [#36040](https://github.com/WordPress/gutenberg/pull/36040)).
-   Removed support for live reload in the `start` command ([#28273](https://github.com/WordPress/gutenberg/pull/28273)).
-   The bundled `webpack-cli` dependency has been updated to the next major version `^4.9.1` ([#28273](https://github.com/WordPress/gutenberg/pull/28273)).
-   The peer `jest` dependency has been updated from requiring `>=26` to requiring `>=27` (see [Breaking Changes](https://jestjs.io/blog/2021/05/25/jest-27), [#33287](https://github.com/WordPress/gutenberg/pull/33287)).
-   The bundled `jest-dev-server` dependency has been updated to the next major version `^6.0.0` ([#33287](https://github.com/WordPress/gutenberg/pull/33287)).
-   The bundled `stylelint` dependency has been updated from requiring `^13.8.0` to requiring `^14.2.0` ([#38091](https://github.com/WordPress/gutenberg/pull/38091)).

### New Features

-   Added a new `plugin-zip` command to create a zip file for a WordPress plugin ([#37687](https://github.com/WordPress/gutenberg/pull/37687)).
-   Added optional support for React Fast Refresh in the `start` command. It can be activated with `--hot` CLI argument ([#28273](https://github.com/WordPress/gutenberg/pull/28273)). For now, it requires that WordPress has the [`SCRIPT_DEBUG`](https://developer.wordpress.org/advanced-administration/debug/debug-wordpress/#script_debug) flag enabled and the [Gutenberg](https://wordpress.org/plugins/gutenberg/) plugin installed.
-   Automatically copy `block.json` files located in the `src` folder and its subfolders to the output folder (`build` by default) ([#37612](https://github.com/WordPress/gutenberg/pull/37612)).
-   Scan the `src` directory for `block.json` files to detect defined scripts to use them as entry points with the `start` and `build` commands. ([#37661](https://github.com/WordPress/gutenberg/pull/37661)).

### Enhancements

-   Disable `selector-class-pattern` rule when linting styles until we have more flexible handling ([#37531](https://github.com/WordPress/gutenberg/pull/37531)).

### Bug Fixes

-   Prevent the `CleanWebpackPlugin` plugin from deleting webpack assets during multi-configuration builds [#35980](https://github.com/WordPress/gutenberg/issues/35980).
-   Remove temporary workaround fixing CommonJS import for `mini-css-extract-plugin` [#38027](https://github.com/WordPress/gutenberg/pull/38027).

### Internal

-   The bundled `read-pkg-up` dependency has been updated from requiring `^1.0.1` to requiring `^7.0.1` ([#37395](https://github.com/WordPress/gutenberg/pull/37395)).

## 19.2.3 (2022-01-17)

### Bug Fixes

-   Added temporary workaround to fix broken CommonJS import of `mini-css-extract-plugin` [#38004](https://github.com/WordPress/gutenberg/pull/38004).

## 19.2.0 (2021-11-15)

### New Features

-   Add basic support for TypeScript in `build`, `start`, `test-e2e` and `test-unit-js` commands ([#36260](https://github.com/WordPress/gutenberg/pull/36260)).

### Enhancements

-   The bundled `browserslist` dependency has been updated from requiring `^4.16.6` to requiring `^4.17.6` ([#36244](https://github.com/WordPress/gutenberg/pull/36244)).
-   Updated the default ESLint config to work correctly with the latest version of `@wordpress/eslint-plugin` ([#36244](https://github.com/WordPress/gutenberg/pull/36244)).

## 19.1.0 (2021-11-07)

### Enhancements

-   Increase the timeout for e2e tests to 30 seconds ([#35983](https://github.com/WordPress/gutenberg/pull/35983)).

## 19.0.0 (2021-10-22)

### Breaking Changes

-   The webpack config was updated to no longer include the polyfill by default when creating the `assets.php` file. If your usage requires the `wp-polyfill`, you must explicitly set it as a dependency ([#34536](https://github.com/WordPress/gutenberg/pull/35436)].

### Enhancements

-   Allow customization of the `ARTIFACTS_PATH` in the `jest-environment-puppeteer` failed test reporter via the `WP_ARTIFACTS_PATH` environment variable ([#35371](https://github.com/WordPress/gutenberg/pull/35371)).

## 18.1.0 (2021-10-12)

### Enhancements

-   The bundled `jest-dev-server` dependency has been updated to the next major version `^5.0.3` ([#34560](https://github.com/WordPress/gutenberg/pull/34560)).

## 18.0.1 (2021-09-09)

### Bug Fixes

-   Bring back support for SVG files in CSS ([#34394](https://github.com/WordPress/gutenberg/pull/34394)). It wasn't correctly migrated when integrating webpack v5.
-   Convert legacy entry point arguments supported in webpack 4 for compatibility with webpack 5 ([#34264](https://github.com/WordPress/gutenberg/pull/34264)).

## 18.0.0 (2021-08-23)

### Breaking Changes

-   Increase the minimum Node.js version to v12.13 matching requirements from bundled dependencies ([#33818](https://github.com/WordPress/gutenberg/pull/33818)).
-   The bundled `webpack` dependency has been updated to the next major version `^5.47.1` (see [Breaking Changes](https://webpack.js.org/migrate/5/), [#33818](https://github.com/WordPress/gutenberg/pull/33818)).
-   The bundled `webpack-cli` dependency has been updated to the next major version `^4.7.2` ([#33818](https://github.com/WordPress/gutenberg/pull/33818)).
-   The bundled `css-loader` dependency has been updated from requiring `^5.1.3` to requiring `^6.2.0` ([#33818](https://github.com/WordPress/gutenberg/pull/33818)).
-   The bundled `file-loader` dependency has been removed ([#33818](https://github.com/WordPress/gutenberg/pull/33818)).
-   The bundled `ignore-emit-webpack-plugin` dependency has been removed ([#33818](https://github.com/WordPress/gutenberg/pull/33818)).
-   The bundled `mini-css-extract-plugin` dependency has been updated from requiring `^1.3.9` to requiring `^2.1.0` ([#33818](https://github.com/WordPress/gutenberg/pull/33818)).
-   The bundled `postcss-loader` dependency has been updated from requiring `^4.2.0` to requiring `^6.1.1` ([#33818](https://github.com/WordPress/gutenberg/pull/33818)).
-   The bundled `sass-loader` dependency has been updated from requiring `^10.1.1` to requiring `^12.1.0` ([#33818](https://github.com/WordPress/gutenberg/pull/33818)).
-   The bundled `source-map-loader` dependency has been updated from requiring `^0.2.4` to requiring `^3.0.0` ([#33818](https://github.com/WordPress/gutenberg/pull/33818)).
-   The bundled `thread-loader` dependency has been removed ([#33818](https://github.com/WordPress/gutenberg/pull/33818)).
-   The bundled `terser-webpack-plugin` dependency has been updated from requiring `^3.0.3` to requiring `^5.1.4` ([#33818](https://github.com/WordPress/gutenberg/pull/33818)).
-   The bundled `webpack-live-reload-plugin` dependency has been updated from requiring `^2.3.0` to requiring `^3.0.1` ([#33818](https://github.com/WordPress/gutenberg/pull/33818)).
-   The bundled `webpack-sources` dependency has been removed ([#33818](https://github.com/WordPress/gutenberg/pull/33818)).

### Enhancements

-   The bundled `@svgr/webpack` dependency has been updated from requiring `^5.2.0` to requiring `^5.5.0` ([#33818](https://github.com/WordPress/gutenberg/pull/33818)).
-   The bundled `webpack-bundle-analyzer` dependency has been updated from requiring `^4.2.0` to requiring `^4.4.2` ([#33818](https://github.com/WordPress/gutenberg/pull/33818)).

### Bug Fixes

-   Add missing fallback for target in webpack 5 config ([#34112](https://github.com/WordPress/gutenberg/pull/34112)),

## 17.1.0 (2021-07-29)

### Enhancements

-   Update `eslint-plugin-markdown` package to `2.20.0` ([#33432](https://github.com/WordPress/gutenberg/pull/33432)).
-   Update `sass` package to `1.35.2` ([#33433](https://github.com/WordPress/gutenberg/pull/33433)).
-   Update webpack config to minimize also CSS files ([#33676](https://github.com/WordPress/gutenberg/pull/33676)).
-   The default PostCSS config uses cssnano to minimize CSS output ([#33750](https://github.com/WordPress/gutenberg/pull/33750)).

## 17.0.0 (2021-07-21)

### Breaking Changes

-   Upgrade `puppeteer-core` (`^9.0.0`) to version `^10.1.0`. This version drops support for Node v10.

### New Features

-   Add .markdownlintignore config and reference from lint-md-docs script ([#32633](https://github.com/WordPress/gutenberg/pull/32633)).

### Enhancements

-   Update `markdownlint` package to `0.23.1` ([#32633](https://github.com/WordPress/gutenberg/pull/32633)).
-   Update `markdownlint-cli` package to `0.27.1` ([#32633](https://github.com/WordPress/gutenberg/pull/32633)).

## 16.1.0 (2021-05-20)

### Bug Fixes

-   The default Babel configuration has changed to respect a local Browserslist configuration.

## 16.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.
-   The bundled `puppeteer-core` (`^5.5.0`) dependency has been upgraded to version `^9.0.0`. Puppeteer uses Chromium v91 instead of Chromium v88. See the full list of breaking changes of [9.0.0](https://github.com/puppeteer/puppeteer/releases/tag/v9.0.0) and lower versions ([#31138](https://github.com/WordPress/gutenberg/pull/31138)).

### New Features

-   Include a Jest Reporter that formats test results for GitHub Actions annotations ([#31041](https://github.com/WordPress/gutenberg/pull/31041)).
-   Have the `format` command ignore files listed in a `.prettierignore` file, add a fallback `.prettierignore` to the package ([30844](https://github.com/WordPress/gutenberg/pull/30844)).
-   The e2e tests are now using [`jest-circus`](https://github.com/facebook/jest/tree/master/packages/jest-circus) as the test runner. This enable us to capture screenshots at the time the tests failed. The unit tests are also using the same test runner for consistency ([#28449](https://github.com/WordPress/gutenberg/pull/28449), [#31178](https://github.com/WordPress/gutenberg/pull/31178)).

### Security

-   Update `postcss` dependency to the latest patch version. Versions before 8.2.10 are vulnerable to Regular Expression Denial of Service (ReDoS) during source map parsing ([#31685](https://github.com/WordPress/gutenberg/pull/31685)).

## 15.0.1 (2021-04-30)

### Bug Fixes

-   Add `postcss` as a dependency to ensure that the correct version gets installed.

## 15.0.0 (2021-04-29)

### Breaking Changes

-   Rename `format-js` script to `format` ([#30240](https://github.com/WordPress/gutenberg/pull/30240)).
-   Include YAML files when formatting files with `format` ([#30240](https://github.com/WordPress/gutenberg/pull/30240)).
-   The bundled `css-loader` dependency has been updated from requiring `^3.5.2` to requiring `^5.1.3` ([#27821](https://github.com/WordPress/gutenberg/pull/27821)).
-   The bundled `mini-css-extract-plugin` dependency has been updated from requiring `^0.9.0` to requiring `^1.3.9` ([#27821](https://github.com/WordPress/gutenberg/pull/27821)).
-   The bundled `postcss-loader` dependency has been updated from requiring `^3.0.0` to requiring `^4.2.0` ([#27821](https://github.com/WordPress/gutenberg/pull/27821)).
-   The bundled `sass-loader` dependency has been updated from requiring `^8.0.2` to requiring `^10.1.1` ([#27821](https://github.com/WordPress/gutenberg/pull/27821)).
-   The bundled `thread-loader` dependency has been updated from requiring `^2.1.3` to requiring `^3.0.1` ([#27821](https://github.com/WordPress/gutenberg/pull/27821)).
-   The bundled `url-loader` dependency has been updated from requiring `^3.0.0` to requiring `^4.1.1` ([#27821](https://github.com/WordPress/gutenberg/pull/27821)).

### New Features

-   `build` and `start` command now bundle files ending with `.module.css` as CSS modules and extracts `style.module.css` ([#29182](https://github.com/WordPress/gutenberg/pull/29182)).

### Enhancements

-   The bundled `webpack` dependency has been updated from requiring `4.42.0` to requiring `^4.46.0` ([#27821](https://github.com/WordPress/gutenberg/pull/27821)).

## 14.1.0 (2021-04-06)

### Enhancements

-   The bundled `babel-loader` dependency has been updated from requiring `^8.1.0` to requiring `^8.2.2` ([#30018](https://github.com/WordPress/gutenberg/pull/30018)).

## 14.0.0 (2021-03-17)

### Breaking Changes

-   Lint TypeScript files as part of `lint-js`. [#27143](https://github.com/WordPress/gutenberg/pull/27143)

### New Features

-   Default `check-engines` command to the `engines` config in `package.json` file of the current project ([#29066](https://github.com/WordPress/gutenberg/pull/29066)).

### Enhancements

-   Make `check-licenses` command compatible with npm v7 ([#28909](https://github.com/WordPress/gutenberg/pull/28909)).
-   Add `Python 2.0` to non-GPL compatible OSS licenses allowed for development in `check-licenses` command ([#29968](https://github.com/WordPress/gutenberg/pull/28968)).
-   Updated `check-node-version` to version `^4.1.0` that no longer processes unrelated engines with `check-engines` command ([#29066](https://github.com/WordPress/gutenberg/pull/29066)).
-   Replace `jest-puppeteer` with the forked version of `jest-environment-puppeteer` to use `puppeteer-core` directly ([#29418](https://github.com/WordPress/gutenberg/pull/29418)).

## 13.0.0 (2021-01-21)

### Breaking Changes

-   Increase the minimum Node.js version to 12 ([#27934](https://github.com/WordPress/gutenberg/pull/27934)).
-   The bundled `jest` dependency has been updated to the next major version `^26.6.3` (see [Breaking Changes](https://jestjs.io/blog/2020/05/05/jest-26), [#27956](https://github.com/WordPress/gutenberg/pull/27956)).
-   The bundled `@wordpress/eslint-plugin` dependency has been updated to the next major version `^8.0.0`. There are new ESLint rules enabled in the recommended config used by `lint-js` command.
-   The bundled `stylelint-config-wordpress` dependency has been replaced with `@wordpress/stylelint-config` (#27810)[https://github.com/WordPress/gutenberg/pull/27810].
-   The bundled `puppeteer-core` (`3.0.0`) dependency has been upgraded to version `5.5.0`. Puppeteer uses Chromium v88 instead of Chromium v71. See the full list of breaking changes of [4.0.0](https://github.com/puppeteer/puppeteer/releases/tag/v4.0.0) and [5.0.0](https://github.com/puppeteer/puppeteer/releases/tag/v5.0.0).

### Enhancements

-   `wordpress` subfolder is no longer ignored when detecting files for testing, linting or formatting.
-   The bundled `eslint` dependency has been updated from requiring `^7.1.0` to requiring `^7.17.0` ([#27965](https://github.com/WordPress/gutenberg/pull/27965)).
-   Make it possible to transpile `.jsx` files with `build` and `start` commands ([#28002](https://github.com/WordPress/gutenberg/pull/28002)).
-   Add support for static assets (fonts and images) for `build` and `start` commands ([#28043](https://github.com/WordPress/gutenberg/pull/28043)).

### Bug Fixes

-   Ensure that `check-engines` uses the same default version of Node.js and npm as this package ([#28143](https://github.com/WordPress/gutenberg/pull/28143)).
-   Prevent translation function names from being mangled to ensure stings are extracted ([#28231](https://github.com/WordPress/gutenberg/pull/28231)).

### Internal

-   The bundled `webpack-bundle-analyzer` dependency has been updated from requiring `^3.6.1` to requiring `^4.2.0`.

## 12.6.1 (2021-01-05)

### Bug Fixes

-   Fix multiple build (`build` command) runtimes conflicting when using globals ([#27985](https://github.com/WordPress/gutenberg/pull/27985)).

## 12.6.0 (2020-12-17)

### Enhancements

-   Autoformat TypeScript files (`*.ts` and `*.tsx`) in `format-js` script (#27138)[https://github.com/WordPress/gutenberg/pull/27138].
-   The bundled `wp-prettier` dependency has been upgraded from `2.0.5` to `2.2.1`.
-   The bundled Babel dependency has been upgraded from `7.11` to `7.12`.

### Internal

-   The bundled `ignore-emit-webpack-plugin` dependency has been updated from requiring `2.0.3` to requiring `^2.0.6`.

## 12.5.0 (2020-10-30)

### Enhancements

-   Ignore `/vendor` folder when searching for files to lint or format.

### Bug Fixes

-   Temporary pin `ignore-emit-webpack-plugin` to the version `2.0.3` to fix a known issue with version `2.0.4` ([GitHub issue](https://github.com/mrbar42/ignore-emit-webpack-plugin/issues/17)).

## 12.1.0 (2020-07-07)

### Enhancements

-   Update webpack configuration to preserve translator comments in minified output.

### Bug Fixes

-   Allow the CSS, SVG, and Sass loaders to process files from node_modules directory.
-   Improve the way licenses are validated with `check-licenses` by falling back to license files verification when the entry in `package.json` doesn't contain an allowed match ([#23550](https://github.com/WordPress/gutenberg/pull/23550)).
-   Fix `build` script error when importing `style.css` files ([#23710](https://github.com/WordPress/gutenberg/pull/23710)).
-   Exclude `node_modules` from source map processing in `start` script ([#23711](https://github.com/WordPress/gutenberg/pull/23711)).

## 12.0.0-rc.0 (2020-06-24)

### Breaking Changes

-   The bundled `stylelint` dependency has been updated from requiring `^9.10.1` to requiring `^13.6.0`.
-   The bundled `stylelint-config-wordpress` dependency has been updated from requiring `^13.1.0` to requiring `^17.0.0`.

### Bug Fixes

-   During rebuilds, all webpack assets that are not used anymore will be removed automatically.

## 11.0.0 (2020-06-15)

### Breaking Changes

-   The `env` family of scripts has been removed. Finally, exceeded in functionality and replaced by [`wp-env`](https://www.npmjs.com/package/@wordpress/env).
-   The default Babel configuration has changed to only support stage-4 proposals. This affects the `build` and `start` commands that use the bundled Babel configuration; if a project provides its own, this change doesn't affect it ([#22083](https://github.com/WordPress/gutenberg/pull/22083)).
-   The bundled `wp-prettier` dependency has been upgraded from `1.19.1` to `2.0.5`. Refer to the [Prettier 2.0 "2020" blog post](https://prettier.io/blog/2020/03/21/2.0.0.html) for full details about the major changes included in Prettier 2.0.
-   The bundled `eslint` dependency has been updated from requiring `^6.8.0` to requiring `^7.1.0`.

### New Features

-   The PostCSS loader now gives preference to a `postcss.config.js` configuration file if present.

### Bug Fixes

-   Update webpack configuration to not run the Sass loader on CSS files. It's now limited to .scss and .sass files.
-   Fix broken `style.(sc|sa|c)ss` handling in the `build` and `start` scripts ([#23127](https://github.com/WordPress/gutenberg/pull/23127)).

## 10.0.0 (2020-05-28)

### New Features

-   New `--webpack-no-externals` flag added to `build` and `start` scripts. It disables scripts' assets generation, and omits the list of default externals ([#22310](https://github.com/WordPress/gutenberg/pull/22310)).
-   New `--webpack-bundle-analyzer` flag added to `build` and `start` scripts. It enables visualization for the size of webpack output files with an interactive zoomable treemap ([#22310](https://github.com/WordPress/gutenberg/pull/22310)).
-   New `--webpack--devtool` flag added to `start` script. It controls how source maps are generated. See options at https://webpack.js.org/configuration/devtool/#devtool ([#22310](https://github.com/WordPress/gutenberg/pull/22310)).
-   The `test-e2e` and `test-unit` scripts will now disambiguate custom configurations, preferring a `jest-e2e.config.js`, `jest-e2e.config.json`, `jest-unit.config.js`, or `jest-unit.config.json` Jest configuration file if present, falling back to `jest.config.js` or `jest.config.json`. This allows for configurations which should only apply to one or the other test variant.

## 9.1.0 (2020-05-14)

### New Features

-   Add new capability to `build` and `start` scripts that automates handling CSS, SASS or SCSS files by importing them from JavaScript code ([#21730](https://github.com/WordPress/gutenberg/pull/21730)). You can find more details about CSS assets management in webpack at https://webpack.js.org/guides/asset-management/#loading-css.

### Enhancements

-   Bundle analysis in `build` script now runs with module concatenation disabled. This represents the size of individual modules more accurately, at the cost of not providing an exact byte-for-byte match to the final size in the production chunk.

### Deprecations

-   `env` script was marked as deprecated. We recommend using `@wordpress/env` package instead that lets you easily set up a local WordPress environment for building and testing plugins and themes.

## 9.0.0 (2020-04-30)

### Breaking Changes

-   The bundled `puppeteer` (`^2.0.0`) dependency has been replaced with `puppeteer-core` in version `3.0.0`. Puppeteer uses Chromium v81 instead of Chromium v79. See the [full list of changes](https://github.com/puppeteer/puppeteer/releases/tag/v3.0.0). It also allowed preventing Chromium installation together with `@wordpress/scripts`. It happens now on-demand when running `test-e2e` script, and it re-triggers only when a new version is required.

### New Features

-   Add support for passing [node CLI options](https://nodejs.org/api/cli.html) to scripts ([#21631](https://github.com/WordPress/gutenberg/pull/21631)).
-   Add debugging support for `test-unit-js` script ([#21631](https://github.com/WordPress/gutenberg/pull/21631)). Tests can be debugged by any [inspector client](https://nodejs.org/en/docs/guides/debugging-getting-started/#inspector-clients) that supports the [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/) using the `--inspect-brk` option.
-   Add debugging support for `test-e2e` script ([#21861](https://github.com/WordPress/gutenberg/pull/21861)). Tests can be debugged by using the `--inspect-brk` option and a new `--puppeteer-devtools` option (or `PUPPETEER_DEVTOOLS="true"` environment variable).

### Bug Fixes

-   The bundled `npm-package-json-lint` dependency has been updated from requiring `^4.0.3` to requiring `^5.0.0` ([#21597](https://github.com/WordPress/gutenberg/pull/21597)). [Breaking changes](https://npmpackagejsonlint.org/docs/en/v4-to-v5) don't break anything in this package. It fixes the abrupt shutdown when `"description"` field in `package.json` is empty.
-   Update `check-licenses` script to parse JSON dependency tree recursively so sub-dependencies of packages passed in `--ignore` flag are ignored as well.

## 8.0.0 (2020-04-15)

### Breaking Changes

-   The bundled `jest` dependency has been updated from requiring `^24.9.0` to requiring `^25.3.0` (see [Breaking Changes](https://jestjs.io/blog/2020/01/21/jest-25), [#20766](https://github.com/WordPress/gutenberg/pull/20766)).

### Enhancements

-   The bundled `eslint` dependency has been updated from requiring `^6.1.0` to requiring `^6.8.0` ([#21424](https://github.com/WordPress/gutenberg/pull/21424)).

## 7.2.0 (2020-04-01)

### Enhancements

-   Incompatibility between `@svgr/webpack` in version `4.3.3` and `url-loader` in version `3.0.0` was fixed by bumping `@svgr/webpack` to `^5.2.0`.
-   All webpack dependencies got minor version update if applicable.

### Internal

-   Package depends now on the shared Prettier config exposed in `@wordpress/prettier-config` dependency ([#20026](https://github.com/WordPress/gutenberg/pull/20026)).

## 7.1.2 (2020-02-25)

### Bug Fixes

-   Ensure `packages-update` work when `dependencies` or `devDependencies` are missing in the `package.json` file ([#20408](https://github.com/WordPress/gutenberg/pull/20408)).

## 7.1.0 (2020-02-10)

### Bug Fixes

-   Ensure the default Prettier config is used in the `lint-js` script when no Prettier config is found in the project ([#20071](https://github.com/WordPress/gutenberg/pull/20071)).

## 7.0.0 (2020-02-04)

### Breaking Changes

-   This package requires now `node` v10.0.0 or later, and `npm` v6.9.0 or later ([#18048](https://github.com/WordPress/gutenberg/pull/18048)).
-   The minimum version required for `npm` in `check-engines` script was increased to `6.9.0+` ([#18048](https://github.com/WordPress/gutenberg/pull/18048)).

### New Features

-   Add SVGR support to compile SVG files to React components using the `@svgr/webpack` plugin ([#18243](https://github.com/WordPress/gutenberg/pull/18243)).
-   Add `format-js` script to format JavaScript source code, it uses the [`wp-prettier`](https://github.com/Automattic/wp-prettier) – Prettier fork adjusted to WordPress coding style guidelines ([#18048](https://github.com/WordPress/gutenberg/pull/18048)).
-   Add `lint-md-js` script to lint JavaScript source code in markdown files, uses the `eslint-plugin-markdown` plugin ([#19518](https://github.com/WordPress/gutenberg/pull/19518)).
-   Add `lint-md-docs` script to lint the markup of markdown files, uses the `markdownlint` module ([#19855](https://github.com/WordPress/gutenberg/pull/19855)).
-   Add `packages-update` script to update WordPress packages to the latest version automatically ([#19448](https://github.com/WordPress/gutenberg/pull/19448)).

### Bug Fixes

-   Fixes and updates valid _rc_ configuration filenames for Babel, ESLint, markdownlint, npmpackagejsonlint, stylelint, and Prettier ([#19994](https://github.com/WordPress/gutenberg/pull/19994)).

## 6.1.1 (2020-01-01)

### Bug Fixes

-   Update `jest-preset-default` dependency to fix preset file extension for inclusion in NPM deployments ([#19306](https://github.com/WordPress/gutenberg/pull/19306)).

## 6.1.0 (2019-12-20)

### New Features

-   Added support to collapse or omit successful test results from Travis CI builds ([#16744](https://github.com/WordPress/gutenberg/issues/16744))

## 6.0.0 (2019-11-14)

### Breaking Changes

-   The bundled `npm-package-json-lint` dependency has been updated from requiring `^3.6.0` to requiring `^4.0.3` ([#18054](https://github.com/WordPress/gutenberg/pull/18054)). Please see the [migration guide](https://npmpackagejsonlint.org/docs/en/v3-to-v4). Note: `npmPackageJsonLintConfig` prop in the `package.json` file needs to be renamed to `npmpackagejsonlint`.
-   The bundled `puppeteer` dependency has been updated from requiring `^1.19.0` to requiring `^2.0.0` ([#18205](https://github.com/WordPress/gutenberg/pull/18205)). It uses Chromium v79 instead of Chromium v77. See the [full list of changes](https://github.com/GoogleChrome/puppeteer/releases/tag/v2.0.0).

## 5.1.0

### New Features

-   The bundled `webpack` dependency has been updated from requiring `4.8.3` to requiring `^4.41.0` ([#17746](https://github.com/WordPress/gutenberg/pull/17746)).

### Bug Fixes

-   Added a temporary workaround for the default config used with `lint-js` command. It uses linting rules for both e2e and unit tests with all files until override files globbing logic is fixed when using `eslint` with `--config` (related [issue](https://github.com/eslint/eslint/issues/11558)).

## 5.0.0 (2019-09-16)

### Breaking Changes

-   The bundled `@wordpress/dependency-extraction-webpack-plugin` dependency has been updated to the next major version `^2.0.0`. `start` and `build` scripts save now the generated asset file for each entry point in the new PHP output format.

## 4.1.0 (2019-09-03)

### New Features

-   Add the new `env` family of scripts [(#17004](https://github.com/WordPress/gutenberg/pull/17004/)).

### Bug Fixes

-   Add `wordpress` folder to the list of ignored paths in all applicable config files ([#17296](https://github.com/WordPress/gutenberg/pull/17296)).

## 4.0.0 (2019-08-29)

### Breaking Changes

-   Test files matching has changed to fix the overlap between two types of tests implemented with `test-e2e` and `test-unit`. Refer to the documentation of the corresponding scripts to learn about new file discovery rules.

### New Features

-   The bundled `puppeteer` dependency has been updated from requiring `1.6.1` to requiring `^1.19.0` ([#16875](https://github.com/WordPress/gutenberg/pull/16875)). It uses Chromium v77 instead of Chromium v69.
-   The bundled `jest-puppeteer` dependency has been updated from requiring `^4.0.0` to requiring `^4.3.0` ([#16875](https://github.com/WordPress/gutenberg/pull/16875)).
-   The bundled `eslint` dependency has been updated from requiring `^5.16.0` to requiring `^6.1.0`.
-   The bundled `@wordpress/eslint-plugin` dependency has been updated to the next major version `^3.0.0` due to new ESLint rules enabled for all test files.

### Bug Fixes

-   Use the SCSS shared `stylelint-config-wordpress` config so that both CSS and SCSS rules are used ([#17060](https://github.com/WordPress/gutenberg/pull/17060))

## 3.4.0 (2019-08-05)

### New Features

-   The `build` and `start` commands supports simplified syntax for multiple entry points: `wp-scripts build entry-one.js entry-two.js` ([15982](https://github.com/WordPress/gutenberg/pull/15982)).

### Bug Fixes

-   Added missing [babel-jest](https://www.npmjs.com/package/babel-jest) dependency ([#16259](https://github.com/WordPress/gutenberg/pull/16259)).

## 3.3.0 (2019-06-12)

### New Features

-   The `lint-js` command lints now JS files in the entire project's directories by default ([15890](https://github.com/WordPress/gutenberg/pull/15890)).
-   The `lint-pkg-json` command lints now `package.json` files in the entire project's directories by default ([15890](https://github.com/WordPress/gutenberg/pull/15890)).
-   The `lint-style` command lints now CSS and SCSS files in the entire project's directories by default ([15890](https://github.com/WordPress/gutenberg/pull/15890)).
-   The `lint-js`, `lint-pkg-json` and `lint-style` commands ignore now files located in `build` and `node_modules` folders by default ([15977](https://github.com/WordPress/gutenberg/pull/15977)).

## 3.2.0 (2019-05-21)

### New Features

-   Leverage `@wordpress/dependency-extraction-webpack-plugin` plugin to extract WordPress
    dependencies.
-   The bundled `eslint` dependency has been updated from requiring `^5.12.1` to requiring `^5.16.0`.

### Enhancements

-   The default Webpack configuration uses [`thread-loader`](https://github.com/webpack-contrib/thread-loader) to parallelize Babel processing.
-   The default Webpack configuration now opts-in to [the `cacheDirectory` option](https://webpack.js.org/loaders/babel-loader/#options) for its Babel loader.
-   The `source-map-loader` is excluded from production builds. This serves only as an optimization and should otherwise have no impact on build results.

## 3.1.0 (2019-03-20)

### New Features

-   The `build` and `start` commands will use a default webpack config if none is provided.

## 3.0.0 (2019-03-06)

### Breaking Changes

-   The bundled `eslint` dependency has been updated from requiring `^4.19.1` to requiring `^5.12.1` (see [Migration Guide](https://eslint.org/docs/user-guide/migrating-to-5.0.0)).
-   The bundled `jest` dependency has been updated from requiring `^23.6.0` to requiring `^24.1.0` (see [Breaking Changes](https://jestjs.io/blog/2019/01/25/jest-24-refreshing-polished-typescript-friendly#breaking-changes), [#13922](https://github.com/WordPress/gutenberg/pull/13922)).
-   The bundled `jest-puppeteer` dependency has been updated from requiring `3.2.1` to requiring `^4.0.0` ([#13922](https://github.com/WordPress/gutenberg/pull/13922)).

### New Features

-   Added support for `build` script ([#12837](https://github.com/WordPress/gutenberg/pull/12837))
-   Added support for `start` script ([#12837](https://github.com/WordPress/gutenberg/pull/12837))
-   Updated `npm-package-json-lint` dependency [#14200](https://github.com/WordPress/gutenberg/pull/14200)

### Bug Fixes

-   Avoid inheriting from ESLint configurations in ancestor directories when using the default configuration ([#13483](https://github.com/WordPress/gutenberg/pull/13483))

## 2.5.0 (2019-01-09)

### New Features

-   Added support for `check-engines` script ([#12721](https://github.com/WordPress/gutenberg/pull/12721))
-   Added support for `lint-style` script ([#12722](https://github.com/WordPress/gutenberg/pull/12722))
-   Added support for `test-e2e` script ([#12437](https://github.com/WordPress/gutenberg/pull/12437))
-   Update default config provided for `lint-js` script ([#12845](https://github.com/WordPress/gutenberg/pull/12845))

## 2.4.4 (2018-11-20)

## 2.4.3 (2018-11-09)

## 2.4.2 (2018-11-09)

## 2.4.1 (2018-11-03)

## 2.4.0 (2018-10-16)

### New Features

-   Added support for `lint-js` script ([#10504](https://github.com/WordPress/gutenberg/pull/10504))

## 2.3.0 (2018-09-30)

### Enhancements

-   New flag `--ignore` for `check-licenses` script
-   Try deferring to LICENSE file for `license` fields which include filename
-   Add "BSD-3-Clause-W3C" as GPL-compatible

## 2.2.1 (2018-09-05)

### Bug Fixes

-   Resolves an issue where npm package lint script did not work in Windows environments ([#9321](https://github.com/WordPress/gutenberg/pull/9321)

### Internal

-   Updated dependencies: `jest`, `npm-package-json-lint` and `read-pkg-up`

## 2.0.0 (2018-07-12)

### Breaking Changes

-   Updated code to work with Babel 7 ([#7832](https://github.com/WordPress/gutenberg/pull/7832))

### Internal

-   Moved `@WordPress/packages` repository to `@WordPress/gutenberg` ([#7805](https://github.com/WordPress/gutenberg/pull/7805))

## 1.2.0 (2018-05-29)

### New Features

-   Added support for `lint-pkg-json` script ([#128](https://github.com/WordPress/packages/pull/128))

## 1.1.5 (2018-05-18)

### Internal

-   Fix: Standardized `package.json` format ([#119](https://github.com/WordPress/packages/pull/119))
