# Disallow use of DOM globals in class constructors (no-dom-globals-in-constructor)

Browser-only DOM globals (e.g. `window`, `document`, `navigator`) must not be referenced inside class constructors. Constructors may run during server-side rendering where DOM APIs are unavailable.

This rule is part of a set of SSR-safety rules that replace the unmaintained `eslint-plugin-ssr-friendly` package.

## Rule details

Examples of **incorrect** code for this rule:

```js
class MyWidget {
	constructor() {
		document.title = 'test';
	}
}

class MyWidget {
	constructor() {
		window.addEventListener( 'resize', () => {} );
	}
}
```

Examples of **correct** code for this rule:

```js
// DOM access in a regular method is allowed.
class MyWidget {
	mount() {
		document.title = 'test';
	}
}

// No DOM globals in constructor — safe.
class MyWidget {
	constructor() {
		this.name = 'test';
	}
}
```
