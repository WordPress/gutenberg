# DotTip

`DotTip` is deprecated and kept only as a no-op compatibility component. It always renders `null`.

New code should use `Guide` from `@wordpress/components` to show user guides.

## Usage

```jsx
<DotTip tipId="acme/add-to-cart">
	This content will not be rendered.
</DotTip>
```

## Props

The component accepts the same props as before for compatibility, but they no longer affect rendering.

### tipId

A string that uniquely identifies the tip.

- Type: `string`
- Required: No

### position

The direction in which the popover previously opened relative to its parent node.

- Type: `String`
- Required: No
- Default: None

### children

Any React element or elements can be passed as children. They will not be rendered.
