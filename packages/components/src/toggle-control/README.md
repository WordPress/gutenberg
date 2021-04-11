# ToggleControl

This component implements a standalone toggle user interface `ToggleControl` is used to generate a toggle user interface.


## Example Usage

### With `useState`

Render a user interface to change fixed background setting.

```jsx
import React, { useState } from 'react';
import { ToggleControl } from '@wordpress/components';

const MyToggleControl = ( ) => {
	const [ checked, setChecked ] = useState( false );
	return <ToggleControl
		label="Toggle control label"
		help={ checked ? 'Is active.' : 'Is not active.' }
		checked={ checked }
		onChange={ () => setChecked( !checked ) }
	/>;
};
```

### Inside a WP Block

```jsx
import { registerBlockType } from '@wordpress/blocks';
import { ToggleControl } from '@wordpress/components';

registerBlockType( 'example/toggle', {
	title: __( 'Example: Toggle Block', 'gutenberg-examples' ),
	icon: 'universal-access-alt',
	category: 'layout',
	edit( { attributes, setAttributes } ) {
		return (
			<ToggleControl
				label="Example Toggle"
				help={ attributes.toggleValue ? 'Toggle is on' : 'Toggle is off' }
				checked={ attributes.toggleValue }
				onChange={ () => setAttributes( { toggleValue: !attributes.toggleValue } ) }
			/>
		);
	},
	save( { attributes } ) {
		return (
			<p>{ attributes.toggleValue ? 'Toggle is on' : 'Toggle is off' }</p>
		);
	},
} );
```

## Props

The component accepts the following props:

### label

If this property is added, a label will be generated using label property as the content.

- Type: `String`
- Required: No

### help

If this property is added, a help text will be generated using help property as the content.

- Type: `String|WPElement`
- Required: No

### checked

If checked is true the toggle will be checked. If checked is false the toggle will be unchecked.
If no value is passed the toggle will be unchecked.

- Type: `Boolean`
- Required: No

### disabled

If disabled is true the toggle will be disabled and apply the appropriate styles.

- Type: `Boolean`
- Required: No


### onChange

A function that receives the checked state (boolean) as input.

- Type: `function`
- Required: No

### className

The class that will be added with `components-base-control` and `components-toggle-control` to the classes of the wrapper div. If no className is passed only `components-base-control` and `components-toggle-control` are used.

Type: String
Required: No
