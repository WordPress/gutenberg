DotTip
========

`DotTip` is a React component that renders a single _tip_ on the screen. The tip will point to the React element that `DotTip` is nested within. Each tip is uniquely identified by a string passed to `tipId`.

## Usage

```jsx
<button onClick={ ... }>
	Add to Cart
	<DotTip tipId="acme/add-to-cart">
		Click here to add the product to your shopping cart.
	</DotTip>
</button>
}
```

## Props

The component accepts the following props:

### tipId

A string that uniquely identifies the tip. Identifiers should be prefixed with the name of the plugin, followed by a `/`. For example, `acme/add-to-cart`.

- Type: `string`
- Required: Yes

### position

The direction in which the popover should open relative to its parent node. Specify y- and x-axis as a space-separated string. Supports `"top"`, `"middle"`, `"bottom"` y axis, and `"left"`, `"center"`, `"right"` x axis.

- Type: `String`
- Required: No
- Default: `"middle right"`

### children

Any React element or elements can be passed as children. They will be rendered within the tip bubble.
