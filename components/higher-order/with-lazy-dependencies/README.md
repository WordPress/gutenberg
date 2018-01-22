# withLazyDependencies

`withLazyDependencies` is a React [higher-order-component] that wraps a
component and, when mounted, automatically loads script and style
dependencies before the mounting the wrapped component.

A script or style dependency is one that has been registered using
`wp_register_script` or `wp_register_style`. It is identified by a unique
string handle.

[higher-order-component]: https://facebook.github.io/react/docs/higher-order-components.html

## Usage

Use the `scripts` attribute to specify which registered scripts should be
loaded before the wrapped component is mounted:

```jsx
function OriginalComponent() {
	return <p>jQuery version: { jQuery.fn.jquery }</p>;
}

const EnhancedComponent = withLazyDependencies( {
	scripts: [ 'jquery' ],
} )( OriginalComponent );
```

Use `styles` to specify which registered styles should be loaded:

```jsx
const EnhancedComponent = withLazyDependencies( {
	styles: [ 'style1', 'style2' ],
} )( OriginalComponent );
```

To dynamically specify which dependencies to load, a function can be given to
`scripts` or `styles`:

```jsx
const EnhancedComponent = withLazyDependencies( {
	scripts() {
		return [ 'jquery' ];
	},
} )( OriginalComponent );
```

Use `loadingComponent` and `errorComponent` to specify what should be
displayed when the dependencies are loading or have failed to load:

```jsx
const EnhancedComponent = withLazyDependencies( {
	scripts: [ 'jquery' ],
	lodingComponent() {
		return <p>Loading jQuery...</p>;
	},
	errorComponent() {
		return <p>Error while loading jQuery!</p>;
	},
} )( OriginalComponent );
```
