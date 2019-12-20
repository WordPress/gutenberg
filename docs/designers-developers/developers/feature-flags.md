# Feature Flags

With phase 2 of the Gutenberg project there's a need for improved control over how code changes are released. Newer features developed for phase 2 and beyond should only be released to the Gutenberg plugin, while improvements and bug fixes should still continue to make their way into core releases.

The technique for handling this is known as a 'feature flag'. 

## Introducing `process.env.GUTENBERG_PHASE`

The `process.env.GUTENBERG_PHASE` is an environment variable containing a number that represents the phase. When the codebase is built for the plugin, this variable will be set to `2`. When building for core, it will be set to `1`.

## Basic Use

A phase 2 function or constant should be exported using the following ternary syntax:

```js
function myPhaseTwoFeature() {
	// implementation
}

export const phaseTwoFeature = process.env.GUTENBERG_PHASE === 2 ? myPhaseTwoFeature : undefined;
```

In phase 1 environments the `phaseTwoFeature` export will be `undefined`.

If you're attempting to import and call a phase 2 feature, be sure to wrap the call to the function in an if statement to avoid an error:
```js
import { phaseTwoFeature } from '@wordpress/foo';

if ( process.env.GUTENBERG_PHASE === 2) {
	phaseTwoFeature();
}
```

### How it works

During the webpack build, any instances of `process.env.GUTENBERG_PHASE` will be replaced using webpack's define plugin (https://webpack.js.org/plugins/define-plugin/).

If you write the following code:
```js
if ( process.env.GUTENBERG_PHASE === 2 ) {
	phaseTwoFeature();
}
```

When building the codebase for the plugin the variable will be replaced with the number literal `2`:
```js
if ( 2 === 2 ) {
	phaseTwoFeature();
}
```

Any code within the body of the if statement will be executed within the gutenberg plugin since `2 === 2` evaluates to `true`.

For core, the `process.env.GUTENBERG_PHASE` variable is replaced with `1`, so the built code will look like:
```js
if ( 1 === 2 ) {
	phaseTwoFeature();
}
```

`1 === 2` evaluates to false so the phase 2 feature will not be executed within core.

### Dead Code Elimination

When building code for production, webpack 'minifies' code (https://en.wikipedia.org/wiki/Minification_(programming)), removing the amount of unnecessary JavaScript as much as possible. One of the steps involves something known as 'dead code elimination'. 

When the following code is encountered, webpack determines that the surrounding `if`statement is unnecessary:
```js
if ( 2 === 2 ) {
	phaseTwoFeature();
}
```

 The condition will alway evaluates to `true`, so can be removed leaving just the code in the body:
 ```js
 phaseTwoFeature();
 ```

Similarly when building for core, the condition in the following `if` statement always resolves to false:
```js
if ( 1 === 2 ) {
	phaseTwoFeature();
}
```

The minification process will remove the entire `if` statement including the body, ensuring code destined for phase 2 is not included in the built JavaScript intended for core.

## FAQ

#### Why should I only use `===` or `!==` when comparing `process.env.GUTENBERG_PHASE` and not `>`, `>=`, `<` or `<=`?

This is a restriction due to the behaviour of the greater than or less than operators in JavaScript when `process.env.GUTENBERG_PHASE` is undefined, as might be the case for third party users of WordPress npm packages. Both `process.env.GUTENBERG_PHASE < 2` and `process.env.GUTENBERG_PHASE > 1` resolve to false. When writing `if ( process.env.GUTENBERG_PHASE > 1 )`, the intention might be to avoid executing the phase 2 code in the following `if` statement's body. That's fine since it will evaluate to false. 

However, the following code doesn't quite have the intended behaviour:

```
function myPhaseTwoFeature() {
	if ( process.env.GUTENBERG_PHASE < 2 ) {
		return;
	}

	// implementation of phase 2 feature
}
```

Here an early return is used to avoid execution of a phase 2 feature, but because the `if` condition resolves to false, the early return is bypassed and the phase 2 feature is incorrectly triggered.

#### Why shouldn't I assign the result of an expression involving `GUTENBERG_PHASE` to a variable, e.g. `const isMyFeatureActive = process.env.GUTENBERG_PHASE === 2`?

The aim here is to avoid introducing any complexity that could result in webpack's minifier not being able to eliminate dead code. See the [Dead Code Elimination](#dead-code-elimination) section for further details.
