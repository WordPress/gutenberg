# No WordPress process.env (no-wp-process-env)

WordPress globals were accessed via `process.env` in the past. This practice created difficulty for
package consumers and was removed.

The correct way to access these globals is now via `globalThis`, e.g. `globalThis.SCRIPT_DEBUG`.
This is safer for package consumers.

This rule is fixable.

## Rule details

Examples of **incorrect** code for this rule:

```js
process.env.SCRIPT_DEBUG;
```

Examples of **correct** code for this rule:

```js
globalThis.SCRIPT_DEBUG;
```
