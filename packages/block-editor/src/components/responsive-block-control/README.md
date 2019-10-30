ResponsiveBlockControl
=============================

`ResponsiveBlockControl` provides a standardised interface for Block controls that require different settings per viewport (ie: "responsive"). 

Complete control over rendering the controls is provided and the viewport sizes used are completely customisable. 

## Usage

In a block's `edit` implementation, render a `<ResponsiveBlockControl />` component passing the required props plus a `renderDefaultControl` function which renders an interface control. By default this default control will be used for the default (ie: "All") setting as well as the per-viewport responsive settings.

```jsx
import { partialRight } from 'lodash';
import { registerBlockType } from '@wordpress/blocks';
import {
	InspectorControls,
	ResponsiveBlockControl,
} from '@wordpress/block-editor';

import {
	DimensionControl,
} from '@wordpress/components';

registerBlockType( 'my-plugin/my-block', {
	// ...

	edit( { attributes, setAttributes } ) {
		
		// Used for example purposes only
		const sizeOptions = [
			{
				label: 'Small',
				value: 'small',
			},
			{
				label: 'Medium',
				value: 'medium',
			},
			{
				label: 'Large',
				value: 'large',
			},
		];

		const { paddingSize } = attributes;

		const handleResponsiveModeChange = (isResponsiveMode) => {
			// handle persisting the toggle state
		};

		const updateSpacing = ( dimension, size, device = '' ) => {
			setAttributes( {
				[ `${ dimension }${ device }` ]: size,
			} );
		};
		
		// Your custom control can be anything you'd like to use.
		// You are not restricted to `DimensionControl`s, but this
		// makes life easier if dealing with standard CSS values.
		const mySizeControl = ( labelComponent, device ) => {
			return (
				<DimensionControl
					label={ device.label }
					onChange={ partialRight( updateSpacing, 'paddingSize' ) }
					value={ paddingSize }
				/>
			);
		};

		return (
			<>
				<InspectorControls>
					<ResponsiveBlockControl
						legend='Block Padding'
						property='padding'
						renderDefaultControl={mySizeControl}
						onIsResponsiveModeChange={handleResponsiveModeChange}
					/>
				</InspectorControls>
				<div>
					// your Block here
				</div>
			</>
		);
	}
} );
```

## Props

```
legend,
property,
toggleLabel,
onIsResponsiveModeChange,
renderDefaultControl,
renderResponsiveControls,
responsiveControlsActive = false,
defaultLabel
devices
```

### `legend`
* **Type:** `String`
* **Default:** `undefined`
* **Required:** `true`

The title of the control group used in the `fieldset`'s `legend` element to label the entire set of controls. 

### `property`
* **Type:** `String`
* **Default:** `undefined`
* **Required:** `true`

Used to build accessible labels and ARIA roles for the control group. Should represent the layout property which the component controls (eg: `padding`, `margin`...etc). 

### `renderDefaultControl`
* **Type:** `Function`
* **Default:** `undefined`
* **Required:** `true`
* **Args:** 
  - **labelComponent:** (`Function`) - a rendered `ResponsiveBlockControlLabel` component for your control.
  - **device:** (`Object`) - an object representing device attributes for your control.

A render function (prop) used to render the control for which you would like to display per viewport settings. The component you return from this function will be used to render the control displayed for the (default) "All" state and (if the `renderResponsiveControls` is not provided) the individual responsive controls when in "responsive" mode. It is passed a pre-created, accessible `<label>`. Your control may also use the contextual information provided by the `device` argument to ensure your component renders appropriately depending on the `device` setting currently being rendered (eg: `All` or one of the responsive variants).

__Note:__ you are required to handle persisting any state produced by the component you pass as `renderDefaultControl`. `ResponsiveBlockControl` is "controlled" and does not persist state in any form.

```jsx
const renderDefaultControl = ( labelComponent, device ) => {
	const { id, label } = device;
	// eg: 
	// {
	// 	id: 'small',
	// 	label: 'All'
	// }
	return (
		<DimensionControl
			label={ labelComponent }
		/>
	);
};
```

### `renderResponsiveControls`
* **Type:** `Function`
* **Default:** `undefined`
* **Required:** `false`
* **Args:** 
  - **devices:** (`Array`) - an array of device `Object`s, each with an `id` and `label` property.
  

An optional render function (prop) used to render the controls for the _responsive_ settings. If not provioded, by default, responsive controls will be _automatically_ rendered using the component returned by the `renderDefaultControl` prop. For _complete_ control over the output of the responsive controls, you may return a suitable component here which will be rendered when the control group is in "responsive" mode.

```jsx
const renderResponsiveControls = (devices) => {
	const inputId = uniqueId(); // lodash 

	return devices.map( ( { id, label } ) => {
		return (
			<Fragment key={ `${ inputId }-${ id }` }>
				<label htmlFor={ `${ inputId }-${ id }` }>Custom Device { label }</label>
				<input
					id={ `${ inputId }-${ id }` }
					defaultValue={ label }
					type="range"
				/>
			</Fragment>
		);
	} );
}
```

### `toggleLabel`
* **Type:** `String`
* **Default:** `Use the same %s on all screensizes.` (where "%s" is the `property` prop - see above )
* **Required:** `false`

Optional label used for the toggle control which switches the interface between showing responsive controls or not.

### `onIsResponsiveModeChange`
* **Type:** `Function`
* **Default:** `undefined`
* **Required:** `false`
* **Args:** 
  - **isResponsiveMode:** (`Boolean`) - whether or not the control is showing the responsive controls. 

A callback function invoked when the component's toggle value is changed between responsive and non-responsive mode. Receives the current state of the control as an `Boolean` argument.

