BlockPreview
============

`<BlockPreview />` allows you to preview blocks.

## Usage

Render the component passing in the required props:

```jsx
<BlockPreview
	blocks={ blocks }
	viewportWidth={ 800 }
/>
```

## Props

### `blocks`
* **Type:** `Array|Object`
* **Default:** `undefined`

A block instance (object) or a blocks array you would like to render a preview.

### `viewportWidth`
* **Type:** `Int`
* **Default:** `700`

Width of the preview container in pixels. Controls at what size the blocks will be rendered inside the preview.

`viewportWidth` can be used to simulate how blocks look on different device sizes or to make sure make sure multiple previews will be rendered with the same scale, regardless of their content.
