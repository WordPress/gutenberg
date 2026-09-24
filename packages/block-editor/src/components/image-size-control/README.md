# ImageSizeControl

Allow users to control the width & height of an image.

## Usage

Render a ImageSizeControl.

```jsx
import { useState } from 'react';
import { __experimentalImageSizeControl as ImageSizeControl } from '@wordpress/block-editor';

const MyImageSizeControl = () => {
	const [ size, setSize ] = useState( { width: null, height: null } );
	// In this example, we have one image with a fixed size of 600x600.
	const imageWidth = 600;
	const imageHeight = 600;

	return (
		<ImageSizeControl
			onChange={ ( value ) => setSize( value ) }
			width={ size.width }
			height={ size.height }
			imageWidth={ imageWidth }
			imageHeight={ imageHeight }
		/>
	);
}
```

## Props

The component accepts the following props:

### imageSizeHelp

If this property is added, a help text will be generated for the image size control, using imageSizeHelp property as the content.

-   Type: `String|Element`
-   Required: No

### slug

The currently-selected image size slug (`thumbnail`, `large`, etc). This is used by the parent component to get the specific image, which is used to populate `imageHeight` & `imageWidth`. This is not required, but necessary when `imageSizeOptions` is used.

-   Type: `string`
-   Required: No

### height

The height of the image when displayed.

-   Type: `number`
-   Required: No

### width

The width of the image when displayed.

-   Type: `number`
-   Required: No

### onChange

The function called when the image size changes. It is passed an object with `{ width, height }` (potentially just one if only one dimension changed).

-   Type: `Function`
-   Required: Yes

### onChangeImage

The function called when a new image size is selected. It is passed the `slug` as an argument. This is not required, but necessary when `imageSizeOptions` is used.

-   Type: `Function`
-   Required: No

### imageSizeOptions

An array of image size slugs and labels. Should be of the format:

```js
[
	{ value: 'thumbnail', label: 'Thumbnail' },
	{ value: 'medium', label: 'Medium' },
	...
]
```

If not provided, the "Image Size" dropdown is not displayed.

-   Type: `array`
-   Required: No

### isResizable

A boolean control for showing the resize fields "Image Dimensions". Set this to false if you want images to always be the fixed size of the selected image.

-   Type: `boolean`
-   Required: No

### imageWidth

The width of the currently selected image, used for calculating the percentage sizes. This will likely be updated when the image size slug changes, but does not control the image display (that's the `width` prop).

-   Type: `number`
-   Required: Yes

### imageHeight

The height of the currently selected image, used for calculating the percentage sizes. This will likely be updated when the image size slug changes, but does not control the image display (that's the `height` prop).

-   Type: `number`
-   Required: Yes
