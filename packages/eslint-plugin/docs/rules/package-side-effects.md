# Enforce package.json `sideEffects` property (package-side-effects)

For tree-shaking to work correctly during a webpack build, packages should declare any files that cause side effects in the `sideEffects` property of the package's package.json.

()[https://webpack.js.org/guides/tree-shaking/]

This linter rule enforces this by detecting package-level side effects and checking the relevant file is defined under the `sideEffects` property.

## Rule details

Examples of **incorrect** code for this rule:

This example shows side effects introduced in a file `src/index.js`.
```js
// Module imports can introduce side effects.
import 'module-with-side-effects';

// Function calls can introduce side effects when the return value is not used.
window.addEventListener( 'resize', handleResize );
registerStore( store );
```

Examples of **correct** code for this rule:

Adding the `src/index.js` file to the `package.json` resolves the issue.
```json
{
	// ...
	"sideEffects": [
		"src/index.js"
	]
}
```


