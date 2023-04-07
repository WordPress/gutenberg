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

Set `viewportWidth` to `0` to make the viewport the same width as the container.

### minHeight

Minimum height of the preview iframe in pixels.

-   **Type:** `Int`
-   **Default:** `undefined`

### `additionalStyles`

List of additional editor styles to load into the preview iframe. Each object
should contain a `css` attribute. See `EditorStyles` for more info.

```jsx
<BlockPreview
	blocks={ blocks }
	additionalStyles={ [
		{ css: 'body { padding: 16px; }' },
	] }
/>
```

-   **Type** `Array`
-   **Default** `[]`
