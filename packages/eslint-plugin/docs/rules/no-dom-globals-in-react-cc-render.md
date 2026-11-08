# Disallow use of DOM globals in React class component render methods (no-dom-globals-in-react-cc-render)

Browser-only DOM globals (e.g. `window`, `document`, `navigator`) must not be referenced inside the `render()` method of a React class component. The render method may be called during server-side rendering where DOM APIs are unavailable.

This rule is part of a set of SSR-safety rules that replace the unmaintained `eslint-plugin-ssr-friendly` package.

## Rule details

Examples of **incorrect** code for this rule:

```jsx
class MyComponent extends React.Component {
	render() {
		const w = window.innerWidth;
		return <div>{ w }</div>;
	}
}
```

Examples of **correct** code for this rule:

```jsx
// DOM access in lifecycle methods is allowed.
class MyComponent extends React.Component {
	componentDidMount() {
		window.scrollTo( 0, 0 );
	}

	render() {
		return <div />;
	}
}

// render() that does not return JSX is not flagged.
class MyComponent {
	render() {
		return document.title;
	}
}
```
