# BlockPreview

`<BlockPreview />` allows you to preview blocks.

## Usage

Render the component passing in the required props:

```jsx
<BlockPreview blocks={ blocks } viewportWidth={ 800 } />
```

## Props

### `blocks`

-   **Type:** `Array|Object`
-   **Default:** `undefined`

A block instance (object) or a blocks array you would like to render a preview.

### `viewportWidth`

-   **Type:** `Int`
-   **Default:** `1200`

Width of the preview container in pixels. Controls at what size the blocks will be rendered inside the preview.

`viewportWidth` can be used to simulate how blocks look on different device sizes or to make sure make sure multiple previews will be rendered with the same scale, regardless of their content.

### \_\_experimentalScalingDelay

-   **Type** `Int`
-   **Default** `100ms`

Defines a delay to be applied before calculating the scale factor and position of the preview block.

### `__experimentalOnReady`

-   **Type** `Function`
-   **Default:** `noop`

Use this callback as an opportunity to know when the preview is ready. The callback will pass, if available:

-   `scale`: the scale factor
-   `position`: offsets position (x, y)
-   `previewContainerRef`: DOM element reference
-   `inlineStyles`: Inline styles applied to the preview container

Eg:

```es6
<BlockPreview
	blocks={ blocks }
	__experimentalOnReady={ ( { scale, previewContainerRef, position } ) => {
		console.log(
			`scale ${ scale } applied to the <${ previewContainerRef.current.tagName }> element.`
		);
		console.log( `at x: ${ position.x }, y: ${ position.y } position.` );
	} }
/>
```
