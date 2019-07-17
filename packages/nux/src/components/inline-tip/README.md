InlineTip
=========

`InlineTip` is a React component that renders a single _tip_ on the screen. It has the same appearance as a [`Notice`](https://developer.wordpress.org/block-editor/components/notice/). Each tip is uniquely identified by a string passed to `tipId`.

## Usage

```jsx
<InlineTip tipId="acme/add-to-cart">
	Add the product to your shopping cart by clicking ‘Add to Cart’.
</InlineTip>
```

## Props

The component accepts the following props:

### tipId

A string that uniquely identifies the tip. Identifiers should be prefixed with the name of the plugin, followed by a `/`. For example, `acme/add-to-cart`.

- Type: `string`
- Required: Yes

### className

Class name added to the rendered tip.

- Type: `string`
- Required: Yes

### children

Any React element or elements can be passed as children. They will be rendered within the tip.
