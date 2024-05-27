# InputControl

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

InputControl components let users enter and edit text. This is an experimental component intended to (in time) merge with or replace [TextControl](../text-control).

## Usage

```js
import { __experimentalInputControl as InputControl } from '@wordpress/components';
import { useState } from 'react';

const Example = () => {
	const [ value, setValue ] = useState( '' );

	return (
		<InputControl
			value={ value }
			onChange={ ( nextValue ) => setValue( nextValue ?? '' ) }
		/>
	);
};
```

## Props

### disabled

If true, the `input` will be disabled.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

### isPressEnterToChange

If true, the `ENTER` key press is required in order to trigger an `onChange`. If enabled, a change is also triggered when tabbing away (`onBlur`).

-   Type: `Boolean`
-   Required: No
-   Default: `false`

### hideLabelFromVision

If true, the label will only be visible to screen readers.

-   Type: `Boolean`
-   Required: No

### label

If this property is added, a label will be generated using label property as the content.

-   Type: `String`
-   Required: No

### labelPosition

The position of the label (`top`, `side`, `bottom`, or `edge`).

-   Type: `String`
-   Required: No

### onChange

A function that receives the value of the input.

-   Type: `Function`
-   Required: Yes

### prefix

Renders an element on the left side of the input.

-   Type: `React.ReactNode`
-   Required: No

### size

Adjusts the size of the input.
Sizes include: `default`, `small`

-   Type: `String`
-   Required: No
-   Default: `default`

### suffix

Renders an element on the right side of the input.

-   Type: `React.ReactNode`
-   Required: No

### type

Type of the input element to render. Defaults to "text".

-   Type: `String`
-   Required: No
-   Default: "text"

### value

The current value of the input.

-   Type: `String`
-   Required: No
