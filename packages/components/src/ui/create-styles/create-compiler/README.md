# create-compiler

This module creates the Emotion instance that backs the style system. It integrates plugins and creates the core `css` function that wraps Emotion's `css` function adding support for breakpoint values on each property.

## Breakpoint values

Breakpoint values are supported by passing an array of values to a CSS property. For example:

```js
css( {
	width: [ 300, 500, 700 ],
} );
```

This will dynamically respond to breakpoints and render the appropriate width for each `min-width`. The breakpoints are documented in the code in [`utils.js`](./utils.js).

## Plugins

`createCompiler` supports passing certain parameters to plugins. Plugin initialization should be contained to [`plugins/index.js`](./plugins/index.js).

The individual plugins are documented in [`plugins/README.md`](./plugins/README.md).

## Custom iframe support

Emotion by default does not support iframe styling. This style system solves this by implementing a custom `sheet.insert` that exposes a `sheet.insert` event which can be listened to by style providers to receive styles from outside of the current iframe.

## Interplated Components

`css` also supports passing style system-connected components as selectors in the same style as `styled-components`. It does this _without any Babel transformations_. Interpolated components are transformed to a special interpolated class name by the `css` function. Components are given an interpolation class name (prefixed by `ic-`) by either the `contextConnect` hook or by `styled` itself. `css` then detects when a component has been passed in and transorms it into a CSS selector.

For example:

```js
const Text = styled.div`
	color: red;
`;

const greenText = css`
	${ Text } {
		color: green;
	}
`;
```

Now any child `Text` of a component that applies the `greenText` generated class name will be targeted with the `color: green` styles.

Psueudo selectors against the interpolated component are possible as well:

```js
const blueText = css`
	${ Text }:first-child {
		color: blue;
	}
`;
```
