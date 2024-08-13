# WordPress global usage (wp-global-usage)

To enable the use of feature flags in Gutenberg some globals are used, such as `IS_GUTENBERG_PLUGIN` and `SCRIPT_DEBUG`.

There are a few rules around using this constant:

-   Only access the globals via `globalThis`, e.g. `globalThis.IS_GUTENBERG_PLUGIN`. This allows the variables to be replaced compile time.
-   The globals should only be used as a conditional test (negation is allowed).

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
if ( globalThis.IS_GUTENBERG_PLUGIN == 1 ) {
	// implement feature here.
}
```

```js
if ( globalThis.IS_GUTENBERG_PLUGIN === true ) {
	// implement feature here.
}
```

```js
if ( true || globalThis.IS_GUTENBERG_PLUGIN ) {
	// implement feature here.
}
```

```js
const isMyFeatureActive = globalThis.IS_GUTENBERG_PLUGIN;
```

Examples of **correct** code for this rule:

```js
if ( globalThis.IS_GUTENBERG_PLUGIN ) {
	// implement feature here.
}
```

```js
if ( ! globalThis.IS_GUTENBERG_PLUGIN ) {
	return;
}
```
