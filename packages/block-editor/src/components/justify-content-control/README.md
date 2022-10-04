## Justify Toolbar

The `JustifyContentControl` component renders a toolbar that displays justify options for the selected block.

This component is used to set the flex justification for the elements in the block, allowing to justify `left`, `center`, `right`, and `space-between`. In comparison, the alignment options are for the block itself.

See the Navigation block for an example usage.

## Development guidelines

### Usage

Renders an justification control with options.

```jsx
import { JustifyContentControl } from '@wordpress/block-editor';

const MyJustifyToolbar = ( { attributes, setAttributes } ) => (
	<BlockControls group="block">
		<JustifyContentControl
			value={ attributes.justification }
			onChange={ ( next ) => {
				setAttributes( { justification: next } );
			} }
		/>
	</BlockControls>
);
```

**NOTE:** The justfify toolbar does not add any classes to your component, you must do this using the `setAttributes` function. The toolbar does define the following classnames you should use:

    items-justified-left
    items-justified-center
    items-justified-right
    items-justified-space-between

_Note:_ In this example that we render `JustifyContentControl` as a child of the `BlockControls` component.

### Props

#### `allowedControls`

-   **Type:** `string[]`
-   **Default:** `[ 'left', 'center', 'right', 'space-between' ]`

An array of strings for what controls to show, by default it shows all.

#### `onChange`

-   **Type:** `Function`
-   **Required:** Yes

A callback function invoked when the toolbar's justification value is changed via an interaction with any of the toolbar's buttons. Called with the new alignment value (ie: `left`, `center`, `right`, `space-between`, `undefined`) as the only argument.

#### `popoverProps`

-   **Type:** `Object`
-   **Required:** No

Properties of `popoverProps` object will be passed as props to the nested `Popover` component.

Use this object to modify props available for the `Popover` component that are not already exposed in the `DropdownMenu` component, e.g.: the direction in which the popover should open relative to its parent node set with `position` prop.

#### `value`

-   **Type:** `String`
-   **Default:** `undefined`
-   **Options:**: `left`, `center`, `right`, `space-between`

The current value of the alignment setting. You may only choose from the `Options` listed above.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.
