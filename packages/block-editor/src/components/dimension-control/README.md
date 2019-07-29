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
				label={ __( 'Padding' ) }
				icon={ 'desktop' }
				iconLabel={ 'Desktop Devices' }
				onReset={ partialRight( resetSpacingDimension, 'paddingSize' ) }
				onSpacingChange={ partialRight( updateSpacing, 'paddingSize' ) }
				currentSize={ paddingSize }
			/>
		);
	}
} );
```

_Note:_ it is recommend to partially apply the value of the Block attribute to be updated (eg: `paddingSize`, `marginSize`...etc) to your callback functions. This avoids the need to unecessarily couple the component to the Block attribute schema.

_Note:_ by default if you do not provide an initial `currentSize` prop for the current dimension value, then no value will be selected (ie: there is no default dimension set). 

## Props

### `label`
* **Type:** `String`
* **Default:** `undefined`
* **Required:** Yes

The human readable label for the control. 

### `currentSize`
* **Type:** `String`
* **Default:** `''`
* **Required:** No

The current value of the dimension the UI controls. If provided the UI with automatically highlight the control representing the current value.

### `icon`
* **Type:** `String`
* **Default:** `undefined`
* **Required:** No

An optional dashicon to display before to the control label.

### `iconLabel`
* **Type:** `String`
* **Default:** `''`
* **Required:** No

A label for the icon (see above).

### `onSpacingChange`
* **Type:** `Function`
* **Default:** `undefined`
* **Required:** No
* **Arguments:**:
  - `size` - a string representing the selected size (eg: `medium`)

A callback which is triggered when a spacing size value changes (is selected/clicked).


### `onReset`
* **Type:** `Function`
* **Default:** `undefined`
* **Required:** No
* **Arguments:**:

A callback which is triggered when the "reset" UI is activated.


