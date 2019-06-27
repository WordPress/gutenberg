BlockPreview
============

BlockPreview allows you to preview any arbitrary HTML and CSS content, with a perfectly scaled thumbnail.

## Usage

In a block's `edit` implementation, render `InnerBlocks`. Then, in the `save` implementation, render `InnerBlocks.Content`. This will be replaced automatically with the content of the nested blocks.

```jsx
<BlockPreviewContent
	name={ name }
	attributes={ {
		...attributes,
		className: styleClassName,
	} }
	innerBlocks={ block.innerBlocks }
	srcWidth={ 400 }
	srcHeight={ 300 }

/>
```

_Note:_ `srcWidth` and `srcHeight` refer to the _unscaled dimensions of what you mean to preview. Think of the preview as a big sourc image, say 800x600 that's scaled down. So if the HTML you mean to preview looks good at 800x600, those are your source dimensionss. A calculated `transform: scale( ...  )` value will be assigned to the thumbnail, so that it fits your destination dimensions, which you set in CSS.
