DimensionControl
=============================

`DimensionControl` is a component designed to provide a UI to control spacing and/or dimensions. It is intended for use within the editor `InspectorControls` sidebar.

## Usage

In a block's `edit` implementation, render a `<DimensionControl />` component. 


```jsx
import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import {
	DimensionControl,
} from '@wordpress/block-editor';

registerBlockType( 'my-plugin/my-block', {
	// ...

	attributes: {
		// other attributes here
		// ...

		paddingSize: {
			type: 'string',
		},
	},

	edit( { attributes, setAttributes, clientId } ) {
		
		const { paddingSize } = attributes;
		

		const updateSpacing = ( dimension, size, device = '' ) => {
			setAttributes( {
				[ `${ dimension }${ device }` ]: size,
			} );
		};

		const resetSpacingDimension = ( dimension, device = '' ) => {
			setAttributes( {
				[ `${ dimension }${ device }` ]: '',
			} );
		};

		return (
			<DimensionControl
				title={ __( 'Padding' ) }
				property="padding"
				id={ clientId }
				onReset={ resetSpacingDimension }
				onSpacingChange={ updateSpacing }
				currentSize={ paddingSize }
			/>
		);
	}
} );
```

_Note:_ by default if you do not provide an initial `currentSize` prop for the current dimension value, then no value will be selected (ie: there is no default dimension set). 

## Props

### `id`
* **Type:** `Int|String`
* **Default:** `undefined`
* **Required:** Yes

A unique ID used to identify the control.

### `title`
* **Type:** `String`
* **Default:** `undefined`
* **Required:** Yes

The human readable title for the control. 

### `property`
* **Type:** `String`
* **Default:** `undefined`
* **Required:** Yes

The spacing/dimension property which this UI is to control. Common examples are `padding` and `margin`.

### `currentSize`
* **Type:** `String`
* **Default:** `''`
* **Required:** No

The current value of the dimension the UI controls. If provided the UI with automatically highlight the control representing the current value.

### `device`
* **Type:** `String`
* **Default:** `all`
* **Required:** No

The device type to which this spacing applies. By default this is set to `all`. Useful when rendering multiple `DimensionControl` components for each device type supported by your Block.

### `deviceIcon`
* **Type:** `String`
* **Default:** `desktop`
* **Required:** No

A dashicon for the device type (see `device` above).

### `onSpacingChange`
* **Type:** `Function`
* **Default:** `undefined`
* **Required:** Yes
* **Arguments:**:
  - `size` - a string representing the selected size (eg: `medium`)

A callback which is triggered when a spacing size value changes (is selected/clicked).


### `onReset`
* **Type:** `Function`
* **Default:** `undefined`
* **Required:** Yes
* **Arguments:**:

A callback which is triggered when the "reset" UI is activated.


