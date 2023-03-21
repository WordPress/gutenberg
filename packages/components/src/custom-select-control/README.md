# CustomSelectControl

`CustomSelectControl` allows users to select an item from a single-option menu just like [`SelectControl`](/packages/components/src/select-control/readme.md), with the addition of being able to provide custom styles for each item in the menu. This means it does not use a native `<select>`, so should only be used if the custom styling is necessary.

## Table of contents

1. [Design guidelines](#design-guidelines)
2. [Development guidelines](#development-guidelines)
3. [Related components](#related-components)

## Design guidelines

These are the same as [the ones for `SelectControl`s](/packages/components/src/select-control/readme.md#design-guidelines).

## Development guidelines

### Usage

```jsx
/**
 * WordPress dependencies
 */
import { CustomSelectControl } from '@wordpress/components';
import { useState } from '@wordpress/element';

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
	const [ , setFontSize ] = useState();
	return (
		<CustomSelectControl
			__nextUnconstrainedWidth
			label="Font Size"
			options={ options }
			onChange={ ( { selectedItem } ) => setFontSize( selectedItem ) }
		/>
	);
}

function MyControlledCustomSelectControl() {
	const [ fontSize, setFontSize ] = useState( options[ 0 ] );
	return (
		<CustomSelectControl
			__nextUnconstrainedWidth
			label="Font Size"
			options={ options }
			onChange={ ( { selectedItem } ) => setFontSize( selectedItem ) }
			value={ options.find( ( option ) => option.key === fontSize.key ) }
		/>
	);
}
```

### Props

#### className

A custom class name to append to the outer `<div>`.

-   Type: `String`
-   Required: No

#### hideLabelFromVision

Used to visually hide the label. It will always be visible to screen readers.

-   Type: `Boolean`
-   Required: No

#### label

The label for the control.

-   Type: `String`
-   Required: Yes

#### describedBy

Pass in a description that will be shown to screen readers associated with the select trigger button. If no value is passed, the text "Currently selected: selectedItem.name" will be used fully translated.

-   Type: `String`
-   Required: No

#### options

The options that can be chosen from.

-   Type: `Array<{ key: String, name: String, style: ?{}, className: ?String, ...rest }>`
-   Required: Yes

#### onChange

Function called with the control's internal state changes. The `selectedItem` property contains the next selected item.

-   Type: `Function`
-   Required: No

#### value

Can be used to externally control the value of the control, like in the `MyControlledCustomSelectControl` example above.

-   Type: `Object`
-   Required: No

#### __nextUnconstrainedWidth

Start opting into the unconstrained width style that will become the default in a future version, currently scheduled to be WordPress 6.4. (The prop can be safely removed once this happens.)

-   Type: `Boolean`
-   Required: No
-   Default: `false`

#### onMouseOver

A handler for onMouseOver events.

-   Type: `Function`
-   Required: No

#### onMouseOut

A handler for onMouseOut events.

-   Type: `Function`
-   Required: No

#### onFocus

A handler for onFocus events.

-   Type: `Function`
-   Required: No

#### onBlur

A handler for onBlur events.

-   Type: `Function`
-   Required: No

## Related components

-   Like this component, but implemented using a native `<select>` for when custom styling is not necessary, the `SelectControl` component.

-   To select one option from a set, when you want to show all the available options at once, use the `Radio` component.
-   To select one or more items from a set, use the `CheckboxControl` component.
-   To toggle a single setting on or off, use the `ToggleControl` component.

-   If you have a lot of items, `ComboboxControl` might be a better fit.
