<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

### New Feature

-   New `build/polyfill.js` (minified version – `build/polyfill.min.js`) file is available that polyfills ECMAScript features missing in the [browsers supported](https://make.wordpress.org/core/handbook/best-practices/browser-support/) by the WordPress project. It's a drop-in replacement for the deprecated `@babel/polyfill` package ([#31279](https://github.com/WordPress/gutenberg/pull/31279)).

## 6.1.0 (2021-05-20)

### Bug Fixes

-   Configure `@babel/preset-env` preset to respect a local Browserslist configuration.

## 6.0.0 (2021-05-14)

### Breaking Changes

-   Drop support for Internet Explorer 11 ([#31110](https://github.com/WordPress/gutenberg/pull/31110)). Learn more at https://make.wordpress.org/core/2021/04/22/ie-11-support-phase-out-plan/.
-   Increase the minimum Node.js version to v12 matching Long Term Support releases ([#31270](https://github.com/WordPress/gutenberg/pull/31270)). Learn more at https://nodejs.org/en/about/releases/.

## 5.2.0 (2021-04-06)

### Enhancements

-   The bundled `@babel/core` dependency has been updated from requiring `^7.12.9` to requiring `^7.13.10` ([#30018](https://github.com/WordPress/gutenberg/pull/30018)).
-   The bundled `@babel/plugin-transform-runtime` dependency has been updated from requiring `^7.12.1` to requiring `^7.13.10` ([#30018](https://github.com/WordPress/gutenberg/pull/30018)).
-   The bundled `@babel/preset-env` dependency has been updated from requiring `^7.12.7` to requiring `^7.13.10` ([#30018](https://github.com/WordPress/gutenberg/pull/30018)).
-   The bundled `@babel/preset-typescript` dependency has been updated from requiring `^7.12.7` to requiring `^7.13.10` ([#30018](https://github.com/WordPress/gutenberg/pull/30018)).
-   The bundled `@babel/runtime` dependency has been updated from requiring `^7.12.5` to requiring `^7.13.10` ([#30018](https://github.com/WordPress/gutenberg/pull/30018)).

## 5.1.0 (2021-03-17)

### New Features

-   Added `@babel/preset-typescript` so that the preset can by default transpile TypeScript files, too.

## 5.0.0 (2021-01-21)

### Breaking Changes

-   Increase the minimum Node.js version to 12 ([#27934](https://github.com/WordPress/gutenberg/pull/27934)).

## 4.20.0 (2020-12-17)

### New Features

-   The bundled `@babel/core` dependency has been updated from requiring `^7.11.6` to requiring `^7.12.9`. All other Babel plugins were updated to the latest version (see [Highlights](https://babeljs.io/blog/2020/10/15/7.12.0)).

## 4.14.0 (2020-05-27)

### Breaking Changes

-   Revert enabling the `shippedProposals` flag. That flag enables the use of stage-3 proposals, but the goal of this preset is to only support stage-4 features. [#22083](https://github.com/WordPress/gutenberg/pull/22083)

### New Features

-   The bundled `@babel/core` dependency has been updated from requiring `^7.9.0` to requiring `^7.11.6`. All other Babel plugins were updated to the latest version (see Highlights: [7.11](https://babeljs.io/blog/2020/07/30/7.11.0) and [7.10](https://babeljs.io/blog/2020/05/25/7.10.0)).

## 4.12.0 (2020-04-15)

### New Features

-   The bundled `@babel/core` dependency has been updated from requiring `^7.8.3` to requiring `^7.9.0`. All other Babel plugins were updated to the latest version (see [Highlights](https://babeljs.io/blog/2020/03/16/7.9.0)).

## 4.10.0 (2020-02-04)

### New Feature

-   The bundled `@babel/core` dependency has been updated from requiring `^7.4.4` to requiring `^7.8.3`. All other Babel plugins were updated to the latest version. `@babel/preset-env` has now ESMAScript 2020 support enabled by default (see [Highlights](https://babeljs.io/blog/2020/01/11/7.8.0#highlights)).

## 4.5.0 (2019-08-29)

### Bug Fixes

-   Added missing `@wordpress/element` dependency which is used internally.

## 4.4.0 (2019-08-05)

### Bug Fixes

-   Configure Babel to target your current version of Node as described in [Jest docs](https://jestjs.io/docs/en/getting-started#using-babel).
-   Added missing [core-js](https://www.npmjs.com/package/core-js) dependency ([#16259](https://github.com/WordPress/gutenberg/pull/16259)).

## 4.2.0 (2019-05-21)

### New Features

-   Handle `<></>` JSX Fragments with `@wordpress/element` `Fragment` ([#15120](https://github.com/WordPress/gutenberg/pull/15120)).
-   The bundled `@babel/core` dependency has been updated from requiring `^7.2.2` to requiring `^7.4.4`. Babel preset is now using `core-js@3` instead of `core-js@2` (see [Migration Guide](https://babeljs.io/blog/2019/03/19/7.4.0#migration-from-core-js-2)).

## 4.0.0 (2019-03-06)

### Breaking Changes

-   Removed `babel-core` dependency acting as Babel 7 bridge ([#13922](https://github.com/WordPress/gutenberg/pull/13922). Ensure all references to `babel-core` are replaced with `@babel/core` .
-   Preset updated to include `@wordpress/babel-plugin-import-jsx-pragma` plugin integration ([#13540](https://github.com/WordPress/gutenberg/pull/13540)). It should no longer be explicitly included in your Babel config.

### Bug Fix

-   The runtime transform no longer disables [the `regenerator` option](https://babeljs.io/docs/en/babel-plugin-transform-runtime#regenerator). This should resolve issues where a file generated using the preset would assume the presence of a `regeneratorRuntime` object in the global scope. While this is not considered a breaking change, you may be mindful to consider that with transformed output now explicitly importing the runtime regenerator, bundle sizes may increase if you do not otherwise mitigate the additional import by either (a) overriding the option in your own Babel configuration extensions or (b) redefining the resolved value of `@babel/runtime/regenerator` using a feature like [Webpack's `externals` option](https://webpack.js.org/configuration/externals/).

## 3.0.0 (2018-09-30)

### Breaking Change

-   The configured `@babel/preset-env` preset will no longer pass `useBuiltIns: 'usage'` as an option. It is therefore expected that a polyfill serve in its place, if necessary.

## 2.1.0 (2018-09-05)

### New Feature

-   Plugin updated to work with the stable version of Babel 7 ([#9171](https://github.com/WordPress/gutenberg/pull/9171)).

## 2.0.0 (2018-07-12)

### Breaking Change

-   Updated code to work with Babel 7 ([#7832](https://github.com/WordPress/gutenberg/pull/7832))

### Internal

-   Moved `@WordPress/packages` repository to `@WordPress/gutenberg` ([#7805](https://github.com/WordPress/gutenberg/pull/7805))

## 1.3.0 (2018-05-22)

### New Feature

-   Added support for async generator functions ([#126](https://github.com/WordPress/packages/pull/126))

## 1.2.1 (2018-05-18)

### Polish

-   Fix: Standardized `package.json` format ([#119](https://github.com/WordPress/packages/pull/119))
