## Justify Toolbar

The `JustifyToolbar` component renders a toolbar that displays justify options for the selected block.

This component is used in the Navigation block to set the flex justification for the elements, allowing for justify `left`, `center`, `right`, and `space-between`.

## Development guidelines

### Usage

Renders an justification toolbar with options.

```jsx
import { JustifyToolbar } from '@wordpress/block-editor';

const MyJustifyToolbar = () => (
	<BlockControls>
		<JustifyToolbar
			value={ textAlign }
			onChange={ ( nextAlign ) => {
				setAttributes( { textAlign: nextAlign } );
			} }
		/>
	</BlockControls>
);
```
_Note:_ In this example that we render `JustifyToolbar` as a child of the `BlockControls` component.

### Props

#### `isCollapsed`
* **Type:** `boolean`

Whether to display toolbar options in the dropdown menu.

#### `onChange`
* **Type:** `Function`

A callback function invoked when the toolbar's justification value is changed via an interaction with any of the toolbar's buttons. Called with the new alignment value (ie: `left`, `center`, `right`, `space-between`, `undefined`) as the only argument.


#### `popoverProps`
* **Type:** `Object`
* **Required:** No

Properties of `popoverProps` object will be passed as props to the nested `Popover` component.

Use this object to modify props available for the `Popover` component that are not already exposed in the `DropdownMenu` component, e.g.: the direction in which the popover should open relative to its parent node set with `position` prop.

#### `value`
* **Type:** `String`
* **Default:** `undefined`
* **Options:**: `left`, `center`, `right`, `space-between`

The current value of the alignment setting. You may only choose from the `Options` listed above.

## Related components

Block Editor components are components that can be used to compose the UI of your block editor. Thus, they can only be used under a [`BlockEditorProvider`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/provider/README.md) in the components tree.

