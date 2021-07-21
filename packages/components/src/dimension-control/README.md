# DimensionControl

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

`DimensionControl` is a component designed to provide a UI to control spacing and/or dimensions.

## Usage

In a block's `edit` implementation, render a `<DimensionControl />` component.

```jsx
import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { DimensionControl } from '@wordpress/block-editor';

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

		return (
			<DimensionControl
				label={ __( 'Padding' ) }
				icon={ 'desktop' }
				onChange={ partialRight( updateSpacing, 'paddingSize' ) }
				value={ paddingSize }
			/>
		);
	},
} );
```

_Note:_ it is recommended to partially apply the value of the Block attribute to be updated (eg: `paddingSize`, `marginSize`...etc) to your callback functions. This avoids the need to unnecessarily couple the component to the Block attribute schema.

_Note:_ by default, if you do not provide an initial `value` prop for the current dimension value, then no value will be selected (ie: there is no default dimension set).

## Props

### `label`

-   **Type:** `String`
-   **Default:** `undefined`
-   **Required:** Yes

The human readable label for the control.

### `value`

-   **Type:** `String`
-   **Default:** `''`
-   **Required:** No

The current value of the dimension UI control. If provided the UI with automatically select the value.

### `sizes`

-   **Type:** `Array`
-   **Default:** See `packages/block-editor/src/components/dimension-control/sizes.js`
-   **Required:** No

An optional array of size objects in the following shape:

```
[
	{
		name: __( 'Small' ),
		slug: 'small',
	},
		{
		name: __( 'Medium' ),
		slug: 'small',
	},
	// ...etc
]
```

By default a set of relative sizes (`small`, `medium`...etc) are provided. See `packages/block-editor/src/components/dimension-control/sizes.js`.

### `icon`

-   **Type:** `String`
-   **Default:** `undefined`
-   **Required:** No

An optional dashicon to display before to the control label.

### `onChange`

-   **Type:** `Function`
-   **Default:** `undefined`
-   **Required:** No
-   **Arguments:**:
    -   `size` - a string representing the selected size (eg: `medium`)

A callback which is triggered when a spacing size value changes (is selected/clicked).

### `className`

-   **Type:** `String`
-   **Default:** `''`
-   **Required:** No

A string of classes to be added to the control component.
