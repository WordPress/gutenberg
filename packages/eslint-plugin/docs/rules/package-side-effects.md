# Enforce package.json `sideEffects` property (package-side-effects)

For tree-shaking to work correctly during a webpack build, packages should declare any files that cause side effects in the `sideEffects` property of the package's package.json.

()[https://webpack.js.org/guides/tree-shaking/]

This linter rule enforces this by detecting package-level side effects and checking the relevant file is defined under the `sideEffects` property.

## Rule details

Examples of **incorrect** code for this rule:

`src/index.js`
```js
window.addEventListener( 'resize', handleResize );
```

`package.json`
```json
{
	// ...
	"sideEffects": false,
}
```


Examples of **correct** code for this rule:

`src/index.js`
```js
window.addEventListener( 'resize', handleResize );
```

`package.json`
```json
{
	// ...
	"sideEffects": [
		"src/index.js"
	]
}
```


