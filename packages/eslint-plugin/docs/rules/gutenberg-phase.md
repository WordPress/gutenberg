# The `GUTENBERG_PHASE` global (gutenberg-phase)

To enable the use of feature flags in Gutenberg, the GUTENBERG_PHASE global constant was introduced. This constant is replaced with a number value at build time using webpack's define plugin.

There are a few rules around using this constant:

- Only access `GUTENBERG_PHASE` via the window object, e.g. `window.GUTENBERG_PHASE`. This ensures that environments that do not inject the variable at build time do not encounter an error due to an undefined global variable (`window.GUTENBERG_PHASE` evaluates as undefined, while `GUTENBERG_PHASE` throws an error.). The webpack configuration will also only replace exact matches of `window.GUTENBERG_PHASE`.
- The `GUTENBERG_PHASE` variable should only be used in a strict equality comparison with a number, e.g. `window.GUTENBERG_PHASE === 2` or `window.GUTENBERG_PHASE !== 2`. The value of the injected variable should always be a number, so this ensures the correct evaluation of the expression. Furthermore, when `GUTENBERG_PHASE` is undefined this comparison still returns either true (for `!==`) or false (for `===`), whereas both the `<` and `>` operators will always return false.
- `GUTENBERG_PHASE` should only be used within the condition of an if statement, e.g. `if ( window.GUTENBERG_PHASE === 2 ) { // implement feature here }`. This rule ensure that where the expression `window.GUTENBERG_PHASE === 2` resolves to false, the entire if statement and its body is removed through dead code elimination.


## Rule details

The following patterns are considered warnings:

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
if ( window.GUTENBERG_PHASE === '2' ) {
	// implement feature here.
}
```

```js
if ( window.GUTENBERG_PHASE > 2 ) {
	// implement feature here.
}
```

```js
if ( true || window.GUTENBERG_PHASE > 2 ) {
	// implement feature here.
}
```

```js
const isMyFeatureActive = window.GUTENBERG_PHASE === 2;
```

The following patterns are not considered warnings:

```js
if ( window.GUTENBERG_PHASE === 2 ) {
	// implement feature here.
}
```

```js
if ( window.GUTENBERG_PHASE !== 2 ) {
	return;
}
```
