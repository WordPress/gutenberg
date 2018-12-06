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

### title

A short string which describes the tip. This is used to label the button which expands or collapses the tip if it is collapsible.

```jsx
<DotTip tipId="acme/add-to-cart" title="Add to Cart">
	Click here to add the product to your shopping cart.
</DotTip>
```

- Type: `string`
- Required: No

### shortcut

An object which, if specified, configures a keyboard shortcut which will expand or collapse the tip if it is collapsible.

The object must contain a `raw` property which is the keyboard shortcut to bind to.

Optionally, the object can contain a `display` property which is a textual description of the shortcut used for the button tooltip.

Optionally, the object can contain an `ariaLabel` property which is a textual description of the shortcut used for screen readers.

```jsx
<DotTip tipId="acme/add-to-cart" shortcut={ { raw: 'ctrl+alt+t' } }>
	Click here to add the product to your shopping cart.
</DotTip>
```

- Type: `Object`
- Required: No
