# Enforce Valid `@since` Versions (`jsdoc-valid-since`)

Enforces a semantic version at the start of every `@since` JSDoc tag while allowing an optional description after the version.

WordPress commonly documents both the version and the change in a single `@since` tag, for example `@since 6.7.0 Added support for ...`. This rule preserves that convention while rejecting incomplete or non-semantic version values.

## Rule details

Examples of **incorrect** code for this rule:

```js
/** @since 3.14 */
/** @since version 7 */
/** @since 6.7.x */
/** @since */
```

Examples of **correct** code for this rule:

```js
/** @since 6.7.0 */
/** @since 6.7.0 Added support for the new behavior. */
/** @since 6.7.0-beta.1 */
```

The optional description is not otherwise validated by this rule.
