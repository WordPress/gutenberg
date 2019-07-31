BlockPreview
============

`<BlockPreview />` allows you to preview any arbitrary HTML and CSS content, with a perfectly scaled thumbnail.

## Usage

Render the component passing in the required props:

```jsx
<BlockPreview
	blocks={ blocks }
	srcWidth={ 400 }
	srcHeight={ 300 }

/>
```

## A note on source dimensions

Please note that `srcWidth` and `srcHeight` refer to the _unscaled dimensions_ of what you mean to preview. 

Think of the preview as a big source image, say 800x600 that's scaled down. So if the HTML you mean to preview looks good at 800x600, those are your source dimensionss. 

A calculated `transform: scale( ...  )` value will be assigned to the thumbnail, so that it fits your _destination_ dimensions, which you set in CSS.


## Props

### `blocks`
* **Type:** `array|object`
* **Default:** `undefined`

A block instance (object) or a blocks array you would like to render a preview.

### `srcWidth`
* **Type:** `Integer`
* **Default:** `400`

The unscaled dimension of the Block you are looking to preview. For example, if the Block looks good at `700x450` then you should set this value to `750`. See also `A note on source dimensions` above.

### `srcHeight`
* **Type:** `Integer`
* **Default:** `300`

The unscaled dimension of the Block you are looking to preview. For example, if the Block looks good at `700x450` then you should set this value to `450`. See also `A note on source dimensions` above.
