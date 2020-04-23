# InputControl

InputControl components let users enter and edit text. This is an experimental component intended to (in time) merge with or replace [TextControl](../text-control).

## Development guidelines

### Usage

Render a user interface to input the name of an additional css class.

```js
import { __experimentalInputControl as InputControl } from '@wordpress/components';
import { useState } from '@wordpress/compose';

const Example = () => {
	const [value, setValue] = useState('')

	return <InputControl value={value} onChange={(nextValue) => setValue(nextValue)} />

) );
```

### Props

#### disabled

If true, the `input` will be disabled.

-   Type: `Boolean`
-   Required: No

#### isFloatingLabel

If true, the `label` will render with a floating interaction.

-   Type: `Boolean`
-   Required: No

#### hideLabelFromVision

If true, the label will only be visible to screen readers.

-   Type: `Boolean`
-   Required: No

#### label

If this property is added, a label will be generated using label property as the content.

-   Type: `String`
-   Required: No

#### onChange

A function that receives the value of the input.

-   Type: `function`
-   Required: Yes

#### size

Adjusts the size of the input.
Sizes include: `default`, `small`

-   Type: `String`
-   Required: No
-   Default: `default`

#### suffix

Renders an element on the right side of the input.

-   Type: `React.ReactNode`
-   Required: No

#### type

Type of the input element to render. Defaults to "text".

-   Type: `String`
-   Required: No
-   Default: "text"

#### value

The current value of the input.

-   Type: `String | Number`
-   Required: Yes
