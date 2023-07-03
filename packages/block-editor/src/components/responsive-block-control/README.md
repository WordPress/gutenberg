# ResponsiveBlockControl

`ResponsiveBlockControl` provides a standardised interface for the creation of Block controls that require **different settings per viewport** (ie: "responsive" settings).

For example, imagine your Block provides a control which affords the ability to change a "padding" value used in the Block display. Consider that whilst this setting may work well on "large" screens, the same value may not work well on smaller screens (it may be too large for example). As a result, you now need to provide a padding control _per viewport/screensize_.

`ResponsiveBlockControl` provides a standardised component for the creation of such interfaces within Gutenberg.

Complete control over rendering the controls is provided and the viewport sizes used are entirely customisable.

Note that `ResponsiveBlockControl` does not handle any persistence of your control values. The control you provide to `ResponsiveBlockControl` as the `renderDefaultControl` prop should take care of this.

## Usage

In a block's `edit` implementation, render a `<ResponsiveBlockControl />` component passing the required props plus:

1. a `renderDefaultControl` function which renders an interface control.
2. an boolean state for `isResponsive` (see "Props" below).
3. a handler function for `onIsResponsiveChange` (see "Props" below).

By default the default control will be used to render the default (ie: "All") setting _as well as_ the per-viewport responsive settings.

```jsx
import { registerBlockType } from '@wordpress/blocks';
import {
	InspectorControls,
	ResponsiveBlockControl,
} from '@wordpress/block-editor';

import { useState } from '@wordpress/element';

import {
	DimensionControl,
} from '@wordpress/components';

registerBlockType( 'my-plugin/my-block', {
	// ...

	edit( { attributes, setAttributes } ) {

		const [ isResponsive, setIsResponsive ] = useState( false );

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


		// Your custom control can be anything you'd like to use.
		// You are not restricted to `DimensionControl`s, but this
		// makes life easier if dealing with standard CSS values.
		// see `packages/components/src/dimension-control/README.md`
		const paddingControl = ( labelComponent, viewport ) => {
			return (
				<DimensionControl
					label={ viewport.label }
					onChange={ // handle update to padding value here  }
					value={ paddingSize }
				/>
			);
		};

		return (
			<>
				<InspectorControls>
					<ResponsiveBlockControl
						title='Block Padding'
						property='padding'
						renderDefaultControl={paddingControl}
						isResponsive={ isResponsive }
						onIsResponsiveChange={ () => {
							setIsResponsive( ! isResponsive );
						} }
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

### `title`

-   **Type:** `String`
-   **Default:** `undefined`
-   **Required:** `true`

The title of the control group used in the `fieldset`'s `legend` element to label the _entire_ set of controls.

### `property`

-   **Type:** `String`
-   **Default:** `undefined`
-   **Required:** `true`

Used to build accessible labels and ARIA roles for the control group. Should represent the layout property which the component controls (eg: `padding`, `margin`...etc).

### `isResponsive`

-   **Type:** `Boolean`
-   **Default:** `false` )
-   **Required:** `false`

Determines whether the component displays the default or responsive controls. Updates the state of the toggle control. See also `onIsResponsiveChange` below.

### `onIsResponsiveChange`

-   **Type:** `Function`
-   **Default:** `undefined`
-   **Required:** `true`

A callback function invoked when the component's toggle value is changed between responsive and non-responsive mode. Should be used to update the value of the `isResponsive` prop to reflect the current state of the toggle control.

### `renderDefaultControl`

-   **Type:** `Function`
-   **Default:** `undefined`
-   **Required:** `true`
-   **Args:**
    -   **labelComponent:** (`Function`) - a rendered `ResponsiveBlockControlLabel` component for your control.
    -   **viewport:** (`Object`) - an object representing viewport attributes for your control.

A render function (prop) used to render the control for which you would like to display per viewport settings.

For example, if you have a `SelectControl` which controls padding size, then pass this component as `renderDefaultControl` and it will be used to render both default and "responsive" controls for "padding".

The component you return from this function will be used to render the control displayed for the (default) "All" state and (if the `renderResponsiveControls` is not provided) the individual responsive controls when in "responsive" mode.

It is passed a pre-created, accessible `<label>`. Your control may also use the contextual information provided by the `viewport` argument to ensure your component renders appropriately depending on the `viewport` setting currently being rendered (eg: `All` or one of the responsive variants).

**Note:** you are required to handle persisting any state produced by the component you pass as `renderDefaultControl`. `ResponsiveBlockControl` is "controlled" and does not persist state in any form.

```jsx
const renderDefaultControl = ( labelComponent, viewport ) => {
	const { id, label } = viewport;
	// eg:
	// {
	// 	id: 'small',
	// 	label: 'All'
	// }
	return <DimensionControl label={ labelComponent } />;
};
```

### `renderResponsiveControls`

-   **Type:** `Function`
-   **Default:** `undefined`
-   **Required:** `false`
-   **Args:**
    -   **viewports:** (`Array`) - an array of viewport `Object`s, each with an `id` and `label` property.

An optional render function (prop) used to render the controls for the _responsive_ settings. If not provided, by default, responsive controls will be _automatically_ rendered using the component returned by the `renderDefaultControl` prop. For _complete_ control over the output of the responsive controls, you may return a component here and it will be rendered when the control group is in "responsive" mode.

```jsx
let uniqueId = 0;

const renderResponsiveControls = ( viewports ) => {
	const inputId = ++uniqueId;

	return viewports.map( ( { id, label } ) => {
		return (
			<Fragment key={ `${ inputId }-${ id }` }>
				<label htmlFor={ `${ inputId }-${ id }` }>
					Custom Viewport { label }
				</label>
				<input
					id={ `${ inputId }-${ id }` }
					defaultValue={ label }
					type="range"
				/>
			</Fragment>
		);
	} );
};
```

### `toggleLabel`

-   **Type:** `String`
-   **Default:** `Use the same %s on all screensizes.` (where "%s" is the `property` prop - see above )
-   **Required:** `false`

Optional label used for the toggle control which switches the interface between showing responsive controls or not.

### `defaultLabel`

-   **Type:** `Object`
-   **Default:**

```js
{
	id: 'all',
	label: 'All',
}
```

-   **Required:** `false`

Optional object describing the attributes of the default value. By default this is `All` which indicates the control will affect "all viewports/screensizes".

### `viewports`

-   **Type:** `Array`
-   **Default:**

```js
[
	{
		id: 'small',
		label: 'Small screens',
	},
	{
		id: 'medium',
		label: 'Medium screens',
	},
	{
		id: 'large',
		label: 'Large screens',
	},
];
```

-   **Required:** `false`

An array of viewport objects, each describing a configuration for a particular viewport size. These are used to determine the number of responsive controls to display and the configuration of each.
