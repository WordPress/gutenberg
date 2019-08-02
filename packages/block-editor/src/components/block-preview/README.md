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

### `scaleAdjustment`
* **Type:** `number`
* **Default:** 1 

Use this to adjust the scale to the desired factor. For instance, 0.5 will reduce the size to 50%.

### `scaleToFit`
* **Type:** `boolean`
* **Default:** true

Use this to adjust the blocks to fit inside the preview viewport.
