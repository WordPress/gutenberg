<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->

## Unreleased

## 6.5.0 (2024-08-07)

### Enhancements

-   Refactor internal proxy and signals system ([#62734](https://github.com/WordPress/gutenberg/pull/62734)).

### Bug Fixes

-   Prevent overriding of existing properties on state and context after a client-side navigation ([#62734](https://github.com/WordPress/gutenberg/pull/62734)).

## 6.4.0 (2024-07-24)

## 6.3.0 (2024-07-10)

## 6.2.0 (2024-06-26)

### Enhancements

-   Export `splitTask` function from `@wordpress/interactivity` package to facilitate yielding to the main thread. See example in [async actions](https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/interactivity-api/api-reference.md#async-actions) documentation. ([#62665](https://github.com/WordPress/gutenberg/pull/62665))

## 6.1.0 (2024-06-15)

## 6.0.0 (2024-05-31)

### New Features

-   Introduce `wp-on-async` directive as performant alternative over synchronous `wp-on` directive. ([#61885](https://github.com/WordPress/gutenberg/pull/61885))

### Breaking Changes

-   Variables like `process.env.IS_GUTENBERG_PLUGIN` have been replaced by `globalThis.IS_GUTENBERG_PLUGIN`. Build systems using `process.env` should be updated ([#61486](https://github.com/WordPress/gutenberg/pull/61486)).
-   Increase the minimum required Node.js version to v18.12.0 matching long-term support releases ([#31270](https://github.com/WordPress/gutenberg/pull/61930)). Learn more about [Node.js releases](https://nodejs.org/en/about/previous-releases).

### Bug Fixes

-   Fix null and number strings as namespaces runtime error. ([#61960](https://github.com/WordPress/gutenberg/pull/61960/))

## 5.7.0 (2024-05-16)

### Enhancements

-   Strict type checking: fix some missing nulls in published types ([#59865](https://github.com/WordPress/gutenberg/pull/59865/)).

### Bug Fixes

-   Allow multiple event handlers for the same type with `data-wp-on-document` and `data-wp-on-window`. ([#61009](https://github.com/WordPress/gutenberg/pull/61009))
-   Prevent wrong written directives from killing the runtime ([#61249](https://github.com/WordPress/gutenberg/pull/61249))
-   Prevent empty namespace or different namespaces from killing the runtime ([#61409](https://github.com/WordPress/gutenberg/pull/61409))

## 5.6.0 (2024-05-02)

## 5.5.0 (2024-04-19)

### Enhancements

-   Improve data-wp-context debugging by validating it as a stringified JSON Object. ([#61045](https://github.com/WordPress/gutenberg/pull/61045))

### Bug Fixes

-   Hooks useMemo and useCallback should return a value. ([#60474](https://github.com/WordPress/gutenberg/pull/60474))

## 5.4.0 (2024-04-03)

## 5.3.0 (2024-03-21)

### Bug Fixes

-   Prevent non-objects from being set in store state. ([#59886](https://github.com/WordPress/gutenberg/pull/59886))
-   Ensure that stores are available for subscription before hydration. ([#59842](https://github.com/WordPress/gutenberg/pull/59842))
-   Ensure scope is restored when catching exceptions thrown in async generator actions. ([#59708](https://github.com/WordPress/gutenberg/pull/59708))

## 5.2.0 (2024-03-06)

### Bug Fixes

-   Prevent passing state proxies as receivers to deepSignal proxy handlers. ([#57134](https://github.com/WordPress/gutenberg/pull/57134))
-   Keep the same references to objects defined inside the context. ([#59553](https://github.com/WordPress/gutenberg/pull/59553))

## 5.1.0 (2024-02-21)

### Bug Fixes

-   Only add proxies to plain objects inside the store. ([#59039](https://github.com/WordPress/gutenberg/pull/59039))
-   Improve context merges using proxies. ([59187](https://github.com/WordPress/gutenberg/pull/59187))

## 5.0.0 (2024-02-09)

### New Features

-   Export `getConfig()` to retrieve the server-defined configuration for the passed namespace. ([58749](https://github.com/WordPress/gutenberg/pull/58749))

### Breaking Changes

-   Remove the style prop (`key`) and class name arguments the `data-wp-style` and `data-wp-class` directives. ([#58835](https://github.com/WordPress/gutenberg/pull/58835)).
-   Remove the `data-wp-body` directive. ([#58835](https://github.com/WordPress/gutenberg/pull/58835))

### Enhancements

-   Break up init with yielding to main to prevent long task from hydration. ([#58227](https://github.com/WordPress/gutenberg/pull/58227))
-   Support setting the namespace using a string in `data-wp-interactive`, like `data-wp-interactive="myPlugin"`. ([#58743](https://github.com/WordPress/gutenberg/pull/58743))

### Bug Fixes

-   Avoid initializing private stores as public when they have initial state. ([#58754](https://github.com/WordPress/gutenberg/pull/58754))

### Bug Fixes

-   Interactivity API: Remove non default suffix data wp context processing. ([#58664](https://github.com/WordPress/gutenberg/pull/58664))

## 4.0.1 (2024-01-31)

### Bug Fixes

-   Ensure Preact is used in published packages ([58258](https://github.com/WordPress/gutenberg/pull/58258).

## 4.0.0 (2024-01-24)

### Enhancements

-   Prevent the usage of Preact components in `wp-text`. ([#57879](https://github.com/WordPress/gutenberg/pull/57879))
-   Update `preact`, `@preact/signals` and `deepsignal` dependencies. ([#57891](https://github.com/WordPress/gutenberg/pull/57891))
-   Export `withScope()` and allow to use it with asynchronous operations. ([#58013](https://github.com/WordPress/gutenberg/pull/58013))
-   Add `block supports` for `clientNavigation` and `interactive` properties on `block.json` schema.([#58132](https://github.com/WordPress/gutenberg/pull/58132))

### New Features

-   Add the `data-wp-run` directive along with the `useInit` and `useWatch` hooks. ([#57805](https://github.com/WordPress/gutenberg/pull/57805))
-   Add `wp-data-on-window` and `wp-data-on-document` directives. ([#57931](https://github.com/WordPress/gutenberg/pull/57931))
-   Add the `data-wp-each` directive to render lists of items using a template. ([57859](https://github.com/WordPress/gutenberg/pull/57859))

### Breaking Changes

-   Remove `data-wp-slot` and `data-wp-fill`. ([#57854](https://github.com/WordPress/gutenberg/pull/57854))
-   Remove `wp-data-navigation-link` directive. ([#57853](https://github.com/WordPress/gutenberg/pull/57853))
-   Remove unused `state` and rename `props` to `attributes` in `getElement()`. ([#57974](https://github.com/WordPress/gutenberg/pull/57974))
-   Convert `navigate` and `prefetch` function to actions of the new `core/router` store, available when importing the `@wordpress/interactivity-router` module. ([#57924](https://github.com/WordPress/gutenberg/pull/57924))

### Bug Fixes

-   Prevent `wp-data-on=""` from creating `onDefault` handlers. ([#57925](https://github.com/WordPress/gutenberg/pull/57925))

## 3.2.0 (2024-01-10)

### Bug Fixes

-   Fix namespaces when there are nested interactive regions. ([#57029](https://github.com/WordPress/gutenberg/pull/57029))

## 3.1.0 (2023-12-13)

## 3.0.0 (2023-11-29)

### Breaking Changes

-   Implement the new `store()` API as specified in the [proposal](https://github.com/WordPress/gutenberg/discussions/53586). ([#55459](https://github.com/WordPress/gutenberg/pull/55459))

## 2.7.0 (2023-11-16)

## 2.6.0 (2023-11-02)

### Bug Fixes

-   Update the title when using enhanced pagination. ([#55446](https://github.com/WordPress/gutenberg/pull/55446))

## 2.5.0 (2023-10-18)

## 2.4.0 (2023-10-05)

## 2.3.0 (2023-09-20)

### Enhancements

-   Improve `navigate()` to render only the result of the last call when multiple happen simultaneously. ([#54201](https://github.com/WordPress/gutenberg/pull/54201))

### Bug Fixes

-   Remove `role` attribute when set to `null` in `data-wp-bind`. ([#54608](https://github.com/WordPress/gutenberg/pull/54608))
-   Add `timeout` option to `navigate()`, with a default value of `10000` milliseconds. ([#54474](https://github.com/WordPress/gutenberg/pull/54474))

## 2.2.0 (2023-08-31)

### Enhancements

-   Support keys using `data-wp-key`. ([#53844](https://github.com/WordPress/gutenberg/pull/53844))
-   Merge new server-side rendered context on client-side navigation. ([#53853](https://github.com/WordPress/gutenberg/pull/53853))
-   Support region-based client-side navigation. ([#53733](https://github.com/WordPress/gutenberg/pull/53733))
-   Improve `data-wp-bind` hydration to match Preact's logic. ([#54003](https://github.com/WordPress/gutenberg/pull/54003))

### New Features

-   Add new directives that implement the Slot and Fill pattern: `data-wp-slot-provider`, `data-wp-slot` and `data-wp-fill`. ([#53958](https://github.com/WordPress/gutenberg/pull/53958))

## 2.1.0 (2023-08-16)

### New Features

-   Allow passing optional `afterLoad` callbacks to `store` calls. ([#53363](https://github.com/WordPress/gutenberg/pull/53363))

### Bug Fixes

-   Add support for underscores and leading dashes in the suffix part of the directive. ([#53337](https://github.com/WordPress/gutenberg/pull/53337))
-   Add an asynchronous short circuit to `useSignalEffect` to avoid infinite loops. ([#53358](https://github.com/WordPress/gutenberg/pull/53358))

### Enhancements

-   Add JSDoc comments to `store()` and `directive()` functions. ([#52469](https://github.com/WordPress/gutenberg/pull/52469))

## 2.0.0 (2023-08-10)

### Breaking Changes

-   Remove the `wp-show` directive until we figure out its final implementation. ([#53240](https://github.com/WordPress/gutenberg/pull/53240))

## 1.2.0 (2023-07-20)

### New Features

-   Runtime support for the `data-wp-style` directive. ([#52645](https://github.com/WordPress/gutenberg/pull/52645))
