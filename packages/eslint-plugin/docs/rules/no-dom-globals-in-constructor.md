# Disallow use of DOM globals in React class component constructors (no-dom-globals-in-constructor)

Browser-only DOM globals (e.g. `window`, `document`, `navigator`) must not be referenced inside constructors of React class components. Those constructors may run during server-side rendering where DOM APIs are unavailable.

Plain (non-React) classes are not flagged. This matches the React-aware sibling rules `no-dom-globals-in-react-fc` and `no-dom-globals-in-react-cc-render`.

This rule is part of a set of SSR-safety rules that replace the unmaintained `eslint-plugin-ssr-friendly` package.

## Rule details

Examples of **incorrect** code for this rule:

```js
class MyComponent extends Component {
	constructor() {
		document.title = 'test';
	}
	render() {
		return null;
	}
}

class MyComponent extends React.Component {
	constructor() {
		window.addEventListener( 'resize', () => {} );
	}
	render() {
		return null;
	}
}
```

Examples of **correct** code for this rule:

```js
// Non-React classes may use DOM globals in constructors.
class Gallery {
	constructor() {
		window.addEventListener( 'resize', () => this.reflow() );
	}
	reflow() {}
}

// DOM access in a regular method is allowed.
class MyComponent extends Component {
	componentDidMount() {
		document.title = 'test';
	}
	render() {
		return null;
	}
}

// No DOM globals in constructor — safe.
class MyComponent extends Component {
	constructor() {
		this.name = 'test';
	}
	render() {
		return null;
	}
}
```
