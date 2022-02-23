# Feature Flags

Often in the Gutenberg project, there's a need to control whether the code we write is shipped to WordPress core, or whether certain more experimental features are only active in the plugin.

Often this is handled using a 'feature flag'.

## Introducing `process.env.IS_GUTENBERG_PLUGIN`

The `process.env.IS_GUTENBERG_PLUGIN` is an environment variable that represents whether code is currently executing within the plugin. When the codebase is built for the plugin, this variable will be set to `true`. When building for core, it will be set to `false` or `undefined`.

## Basic Use

A plugin only function or constant should be exported using the following ternary syntax:

```js
function myPluginOnlyFeature() {
	// implementation
}

export const pluginOnlyFeature =
	process.env.IS_GUTENBERG_PLUGIN ? myPluginOnlyFeature : undefined;
```

In non-plugin environments the `phaseTwoFeature` export will be `undefined`.

If you're attempting to import and call a plugin only feature, be sure to wrap the call to the function in an if statement to avoid an error:

```js
import { pluginOnlyFeature } from '@wordpress/foo';

if ( process.env.IS_GUTENBERG_PLUGIN ) {
	pluginOnlyFeature();
}
```

### How it works

During the webpack build, any instances of `process.env.IS_GUTENBERG_PLUGIN` will be replaced using webpack's define plugin (https://webpack.js.org/plugins/define-plugin/).

If you write the following code:

```js
if ( process.env.IS_GUTENBERG_PLUGIN ) {
	pluginOnlyFeature();
}
```

When building the codebase for the plugin the variable will be replaced with the boolean `true`:

```js
if ( true ) {
	pluginOnlyFeature();
}
```

Any code within the body of the if statement will be executed because of this truthyness.

For core, the `process.env.IS_GUTENBERG_PLUGIN` variable is replaced with `undefined`, so the built code will look like:

```js
if ( undefined ) {
	pluginOnlyFeature();
}
```

`undefined` evaluates to `false` so the plugin only feature will not be executed within core.

### Dead Code Elimination

When building code for production, webpack 'minifies' code (https://en.wikipedia.org/wiki/Minification_(programming)), removing the amount of unnecessary JavaScript as much as possible. One of the steps involves something known as 'dead code elimination'.

When the following code is encountered, webpack determines that the surrounding `if`statement is unnecessary:

```js
if ( true ) {
	pluginOnlyFeature();
}
```

The condition will always evaluates to `true`, so can be removed leaving just the code in the body:

```js
pluginOnlyFeature();
```

Similarly when building for core, the condition in the following `if` statement always resolves to false:

```js
if ( undefined ) {
	pluginOnlyFeature();
}
```

The minification process will remove the entire `if` statement including the body, ensuring plugin only code is not included in the built JavaScript intended for core.

## FAQ

#### Why shouldn't I assign the result of an expression involving `IS_GUTENBERG_PLUGIN` to a variable, e.g. `const isMyFeatureActive = process.env.IS_GUTENBERG_PLUGIN === 2`?

The aim here is to avoid introducing any complexity that could result in webpack's minifier not being able to eliminate dead code. See the [Dead Code Elimination](#dead-code-elimination) section for further details.
