# BottomSheetSelectControl

`BottomSheetSelectControl` allows users to select an item from a single-option menu just like [`SelectControl`](/packages/components/src/select-control/readme.md),
However, instead of opening up the selection in a modal, the selection opens up in a BottomSheet.

### Usage

```jsx
/**
 * WordPress dependencies
 */
import { BottomSheetSelectControl } from '@wordpress/components';
import { useState } from 'react';

const options = [
	{
		key: 'small',
		name: 'Small',
		style: { fontSize: '50%' },
	},
	{
		key: 'normal',
		name: 'Normal',
		style: { fontSize: '100%' },
	},
	{
		key: 'large',
		name: 'Large',
		style: { fontSize: '200%' },
	},
	{
		key: 'huge',
		name: 'Huge',
		style: { fontSize: '300%' },
	},
];

function MyCustomSelectControl() {
	const [ fontSize, setFontSize ] = useState();
	return (
		<BottomSheetSelectControl
			label="Font Size"
			options={ options }
			onChange={ ( { selectedItem } ) => setFontSize( selectedItem ) }
		/>
	);
}

function MyControlledCustomSelectControl() {
	const [ fontSize, setFontSize ] = useState( options[ 0 ] );
	return (
		<BottomSheetSelectControl
			label="Font Size"
			options={ options }
			onChange={ ( { selectedItem } ) => setFontSize( selectedItem ) }
			value={ options.find( ( option ) => option.key === fontSize.key ) }
		/>
	);
}
```

### Props

#### label

The label for the control.

-   Type: `String`
-   Required: Yes

#### options

The options that can be chosen from.

-   Type: `Array<{ key: String, name: String, ...rest }>`
-   Required: Yes

#### onChange

Function called with the control's internal state changes. The `selectedItem` property contains the next selected item.

-   Type: `Function`
-   Required: No

#### value

Can be used to externally control the value of the control, like in the `MyControlledCustomSelectControl` example above.

-   Type: `Object`
-   Required: No

#### icon

The icon for the control.

-   Type: `Icon component`
-   Required: No