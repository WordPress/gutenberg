# Feature Flags

With phase 2 of the Gutenberg project there's a need for improved control over how code changes are released. Newer features developed for phase 2 should only be released to the Gutenberg plugin, while improvements and bug fixes should still continue to make their way into core releases.

The technique for handling this is known as a 'feature flag'. 

## Introducing `window.GUTENBERG_PHASE`

The `window.GUTENBERG_PHASE` constant is a global variable containing a number representing the phase. When the codebase is built for the plugin, this variable will be set to `2`. When building for core, it will be set to `1`.

### How it works

More precisely, the `GUTENBERG_PHASE` variable isn't actually set to a value. Instead, any instances of `window.GUTENBERG_PHASE` in the codebase will be replaced during the webpack build by webpack's define plugin (https://webpack.js.org/plugins/define-plugin/).

If you write the following code:
```js
if ( window.GUTENBERG_PHASE === 2 ) {
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

For core, the `window.GUTENBERG_PHASE` variable is set to `1`, so the built code will look like:
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

## Basic Use

As a simple rule, try to avoid executing any code for a phase 2 feature by using the following techniques:

### Simple if statement

If you're enhancing existing code with a phase 2 feature, try extracting phase 2 code into a separate function as much as possible, and avoid calling that function:
```js
if ( window.GUTENBERG_PHASE === 2) {
	myPhaseTwoFeature();
}
```

### Early return

Alternatively, inside a function, return as early as possible before any phase 2 code can be executed:

```js
export default function myPhaseTwoFeature() {
	if ( window.GUTENBERG_PHASE !== 2 ) {
		return;
	}

	// implementation of feature
}
```

An early return may have to be used for a function that is exported since `export` statements can't be dynamic.


## FAQ

### Since `GUTENBERG_PHASE` is a global object, why do I have to access it through the `window` object, e.g. `window.GUTENBERG_PHASE`?

Third-party consumers of WordPress npm packages may have their own build process, resulting in `window.GUTENBERG_PHASE` not being replaced at build time with the appropriate number. In JavaScript, when attempting to access an undefined global variable an error is thrown, a situation that would cause lots of issues for third-parties (or additional build configuration). Accessing the `GUTENBERG_PHASE` variable through the `window` object circumvents this, the value of the variable evaluates to `undefined` resulting in WordPress packages continuing to work for third-parties.

### Why should I only use `===` or `!==` when comparing `window.GUTENBERG_PHASE` and not `>`, `>=`, `<` or `<=`?

This is a restriction due to the behaviour of the greater than or less than operators in JavaScript when `window.GUTENBERG_PHASE` is undefined, as might be the case for third party users of WordPress npm packages. Both `window.GUTENBERG_PHASE < 2` and `window.GUTENBERG_PHASE > 1` resolve to false. When writing `if ( window.GUTENBERG_PHASE > 1 )`, the intention might be to avoid executing the phase 2 code in the following `if` statement's body. That's fine since it will evaluate to false. 

However, the following code doesn't quite have the intended behaviour:

```
function myPhaseTwoFeature() {
	if ( window.GUTENBERG_PHASE < 2 ) {
		return;
	}

	// implementation of phase 2 feature
}
```

Here an early return is used to avoid execution of a phase 2 feature, but because the `if` condition resolves to false, the early return is bypassed and the phase 2 feature is incorrectly triggered.

### Why shouldn't I assign the result of an expression involving `GUTENBERG_PHASE` to a variable, e.g. `const isMyFeatureActive = window.GUTENBERG_PHASE === 2`?

The aim here is to avoid introducing any complexity that could result in webpack's minifier not being able to eliminate dead code. See the [Dead Code Elimination](#Dead_Code_Elimination) section for further details.
