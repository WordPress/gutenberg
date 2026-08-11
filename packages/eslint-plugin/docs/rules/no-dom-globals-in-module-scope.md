# Disallow use of DOM globals in module scope (no-dom-globals-in-module-scope)

Browser-only DOM globals (e.g. `window`, `document`, `navigator`, `localStorage`) must not be referenced at the module's top level. Module-scope code runs at import time, which may happen during server-side rendering where DOM APIs are unavailable.

This rule is part of a set of SSR-safety rules that replace the unmaintained `eslint-plugin-ssr-friendly` package.

## Rule details

Examples of **incorrect** code for this rule:

```js
const width = window.innerWidth;
const el = document.createElement( 'div' );
navigator.userAgent;
localStorage.getItem( 'key' );
```

Examples of **correct** code for this rule:

```js
// Inside a function — runs at call time, not import time.
function getWidth() {
	return window.innerWidth;
}

// typeof checks are allowed (safe guard pattern).
if ( typeof window !== 'undefined' ) {
	// ...
}

// Shared globals (available in both browser and Node) are allowed.
console.log( 'hello' );
setTimeout( () => {}, 100 );
```
