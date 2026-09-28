# Disallow use of DOM globals in the render cycle of a React function component (no-dom-globals-in-react-fc)

Browser-only DOM globals (e.g. `window`, `document`, `navigator`) must not be referenced directly inside a React function component's body. Code in the function body runs during rendering, which may happen during server-side rendering where DOM APIs are unavailable. Move DOM access into `useEffect()` or event handlers instead.

This rule is part of a set of SSR-safety rules that replace the unmaintained `eslint-plugin-ssr-friendly` package.

## Rule details

Examples of **incorrect** code for this rule:

```jsx
function Component() {
	window.addEventListener( 'resize', () => {} );
	return <div />;
}

const Header = () => {
	const w = document.body.clientWidth;
	return <header>{ w }</header>;
};

// Concise arrow function components are also detected.
const Icon = ( { name } ) => <span className={ window.iconPrefix + name } />;
```

Examples of **correct** code for this rule:

```jsx
// No DOM globals — safe.
function Component() {
	return <div />;
}

// DOM access inside useEffect — runs after render, not during SSR.
function Component() {
	useEffect( () => {
		window.scrollTo( 0, 0 );
	} );
	return <div />;
}

// DOM access inside an event handler — runs at event time.
function Component() {
	const onClick = () => {
		document.title = 'clicked';
	};
	return <button onClick={ onClick } />;
}

// Not a component (no JSX return) — not flagged.
function notAComponent() {
	window.scrollTo( 0, 0 );
}
```
