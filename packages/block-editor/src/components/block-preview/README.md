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

### `__experimentalOnReady`
* **Type** `Function`
* **Default:** `noop`

Use this callback as an opportunity to know when the preview is ready. The callback will pass the scale factor, offsets position (x, y) and the DOM element reference, if available. Eg:

```es6

<BlockPreview
	__experimentalOnReady={ ( { scale } ) => console.log( `Current preview scale: ${ scale }` )
	blocks={ blocks }
/>
```
