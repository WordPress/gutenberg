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

### children

Any React element or elements can be passed as children. They will be rendered within the tip bubble.

### isCollapsible

Marks a tip as being collapsible. Collapsible tips show a pulsating indicator and nothing else. Clicking on the indicator will expand or collapse the tip.

Defaults to `false`.

- Type: `boolean`
- Required: No

### label

The ARIA label used to describe the button that opens or closes a collapsible tip.

If a function is provided then it will be invoked with `isOpen` as the argument, allowing one to change the label depeneding on whether the button opens or closes the tip.

```jsx
<DotTip tipId="acme/add-to-cart" label={ ( isOpen ) => isOpen ? 'Close tip' : 'Open tip' }>
	Click here to add the product to your shopping cart.
</DotTip>
```

- Type: `string` or `Function`
- Required: No
