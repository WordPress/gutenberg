# The `GUTENBERG_PHASE` global (gutenberg-phase)

To enable the use of feature flags in Gutenberg, the GUTENBERG_PHASE global constant was introduced. This constant is replaced with a number value at build time using webpack's define plugin.

There are a few rules around using this constant:

- Only access `GUTENBERG_PHASE` via `process.env`, e.g. `process.env.GUTENBERG_PHASE`. This is required since webpack's define plugin only replaces exact matches of `process.env.GUTENBERG_PHASE` in the codebase.
- The `GUTENBERG_PHASE` variable should only be used in a strict equality comparison with a number, e.g. `process.env.GUTENBERG_PHASE === 2` or `process.env.GUTENBERG_PHASE !== 2`. The value of the injected variable should always be a number, so this ensures the correct evaluation of the expression. Furthermore, when `process.env.GUTENBERG_PHASE` is undefined this comparison still returns either true (for `!==`) or false (for `===`), whereas both the `<` and `>` operators will always return false.
- `GUTENBERG_PHASE` should only be used within the condition of an if statement, e.g. `if ( process.env.GUTENBERG_PHASE === 2 ) { // implement feature here }` or ternary `process.env.GUTENBERG_PHASE === 2 ? something : somethingElse`. This rule ensures code that is disabled through a feature flag is removed by dead code elimination.


## Rule details

Examples of **incorrect** code for this rule:

```js
if ( GUTENBERG_PHASE === 2 ) {
	// implement feature here.
}
```

```js
if ( window[ 'GUTENBERG_PHASE' ] === 2 ) {
	// implement feature here.
}
```

```js
if ( process.env.GUTENBERG_PHASE === '2' ) {
	// implement feature here.
}
```

```js
if ( process.env.GUTENBERG_PHASE > 2 ) {
	// implement feature here.
}
```

```js
if ( true || process.env.GUTENBERG_PHASE > 2 ) {
	// implement feature here.
}
```

```js
const isMyFeatureActive = process.env.GUTENBERG_PHASE === 2;
```

Examples of **correct** code for this rule:

```js
if ( process.env.GUTENBERG_PHASE === 2 ) {
	// implement feature here.
}
```

```js
if ( process.env.GUTENBERG_PHASE !== 2 ) {
	return;
}
```
