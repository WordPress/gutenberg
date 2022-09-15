# The `IS_GUTENBERG_PLUGIN` global (is-gutenberg-plugin)

To enable the use of feature flags in Gutenberg, the IS_GUTENBERG_PLUGIN global constant was introduced. This constant is replaced with a boolean value at build time using webpack's define plugin.

There are a few rules around using this constant:

-   Only access `IS_GUTENBERG_PLUGIN` via `process.env`, e.g. `process.env.IS_GUTENBERG_PLUGIN`. This is required since webpack's define plugin only replaces exact matches of `process.env.IS_GUTENBERG_PLUGIN` in the codebase.
-   The `IS_GUTENBERG_PLUGIN` variable should only be used as a simple boolean expression.
-   `IS_GUTENBERG_PLUGIN` should only be used within the condition of an if statement, e.g. `if ( process.env.IS_GUTENBERG_PLUGIN ) { // implement feature here }` or ternary `process.env.IS_GUTENBERG_PLUGIN ? something : somethingElse`. This rule ensures code that is disabled through a feature flag is removed by dead code elimination.

## Rule details

Examples of **incorrect** code for this rule:

```js
if ( IS_GUTENBERG_PLUGIN ) {
	// implement feature here.
}
```

```js
if ( window[ 'IS_GUTENBERG_PLUGIN' ] ) {
	// implement feature here.
}
```

```js
if ( process.env.IS_GUTENBERG_PLUGIN == 1 ) {
	// implement feature here.
}
```

```js
if ( process.env.IS_GUTENBERG_PLUGIN === true ) {
	// implement feature here.
}
```

```js
if ( true || process.env.IS_GUTENBERG_PLUGIN ) {
	// implement feature here.
}
```

```js
const isMyFeatureActive = process.env.IS_GUTENBERG_PLUGIN;
```

Examples of **correct** code for this rule:

```js
if ( process.env.IS_GUTENBERG_PLUGIN ) {
	// implement feature here.
}
```

```js
if ( ! process.env.IS_GUTENBERG_PLUGIN ) {
	return;
}
```
