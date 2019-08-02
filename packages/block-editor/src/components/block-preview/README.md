BlockPreview
============

`<BlockPreview />` allows you to preview blocks.

## Usage

Render the component passing in the required props:

```jsx
<BlockPreview
	blocks={ blocks }
	isScaled={ false }
/>
```

## Props

### `blocks`
* **Type:** `array|object`
* **Default:** `undefined`

A block instance (object) or a blocks array you would like to render a preview.

### `isScaled`
* **Type:** `Boolean`
* **Default:** `false`

Use this if you need to render previews in smaller areas, like block thumbnails.
