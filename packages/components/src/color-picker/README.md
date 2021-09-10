# ColorPicker

Accessible color picker.

_Parts of the source code were derived and modified from [react-color](https://github.com/casesandberg/react-color/), released under the MIT license._

## Usage

```jsx
import { ColorPicker } from '@wordpress/components';
import { useState } from '@wordpress/element';

const MyColorPicker = () => {
	const [ color, setColor ] = useState( '#f00' );

	return (
		<ColorPicker
			color={ color }
			onChangeComplete={ ( value ) => setColor( value.hex ) }
			disableAlpha
		/>
	);
};
```
