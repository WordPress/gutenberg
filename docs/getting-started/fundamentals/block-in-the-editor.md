# The block in the Editor

The Block Editor is a React Single Page Application (SPA) and every block in the editor is displayed through a React component defined in the `Edit` property of the settings object used to [register the block on the client](https://developer.wordpress.org/block-editor/getting-started/fundamentals/registration-of-a-block/#registration-of-the-block-with-javascript-client-side). 

The `props` object received by the block's `Edit` React component includes `attributes` and `setAttributes` to read and update the attributes, so this component is an excellent place to update the block's `attributes` according to certain conditions or events triggered in the Block Editor.

Custom settings controls for the block in the Editor (in the `Block Toolbar` or in the `Settings Sidebar`) can also be defined through this `Edit` React component via components such as:
- [`InspectorControls`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inspector-controls/README.md) 
- [`BlockControls`](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-editor/src/components/block-controls) 


## Block Controls: Block Toolbar and Settings Sidebar

To simplify block customization and ensure a consistent experience for users, there are a number of built-in UI patterns to help generate the editor preview. 

### Block Toolbar

![Screenshot of the rich text toolbar applied to a Paragraph block inside the block editor](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/assets/toolbar-text.png)

When the user selects a block, a number of control buttons may be shown in a toolbar above the selected block. Some of these block-level controls may be included automatically but you can also customize the toolbar to include controls specific to your block type. If the return value of your block type's `edit` function includes a `BlockControls` element, those controls will be shown in the selected block's toolbar.

```js
function Edit( props ) {
	
	...

	return (
		<div { ...useBlockProps() }>
			<BlockControls>
				<ToolbarGroup>
					<AlignmentToolbar
						value={ attr.alignment }
						onChange={ onChangeAlignment }
					/>
					<ToolbarButton
						icon={ external }
						label="Redirect to more examples"
						onClick={ redirectToMoreExamples }
					/>
				</ToolbarGroup>
			</BlockControls>

			<RichText
				className={ className }
				style={ { textAlign: attr.alignment } }
				tagName="p"
				onChange={ onChangeContent }
				value={ attr.content }
			/>
		</div>
	);
}
```
_See the [full block example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/block-toolbar-ab967f) of the [code above](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/block-toolbar-ab967f/src/edit.js)_


Note that `BlockControls` is only visible when the block is currently selected and in visual editing mode.

## Settings Sidebar

![Screenshot of the inspector panel focused on the settings for a Paragraph block](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/assets/inspector.png)

The Settings Sidebar is used to display less-often-used settings or settings that require more screen space. The Settings Sidebar should be used for **block-level settings only**.

If you have settings that affects only selected content inside a block (example: the "bold" setting for selected text inside a paragraph): **do not place it inside the Settings Sidebar**. The Settings Sidebar is displayed even when editing a block in HTML mode, so it should only contain block-level settings.

The Block Tab is shown in place of the Document Tab when a block is selected.

Similar to rendering a toolbar, if you include an `InspectorControls` element in the return value of your block type's `edit` function, those controls will be shown in the Settings Sidebar region.

```jsx
import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { TextControl } from '@wordpress/components';

import {
	useBlockProps,
	ColorPalette,
	InspectorControls,
} from '@wordpress/block-editor';

registerBlockType( 'create-block/gutenpride', {
	apiVersion: 3,
	attributes: {
		message: {
			type: 'string',
			source: 'text',
			selector: 'div',
			default: '', // empty default
		},
		bg_color: { type: 'string', default: '#000000' },
		text_color: { type: 'string', default: '#ffffff' },
	},
	edit: ( { attributes, setAttributes } ) => {
		const onChangeBGColor = ( hexColor ) => {
			setAttributes( { bg_color: hexColor } );
		};

		const onChangeTextColor = ( hexColor ) => {
			setAttributes( { text_color: hexColor } );
		};

		return (
			<div { ...useBlockProps() }>
				<InspectorControls key="setting">
					<div id="gutenpride-controls">
						<fieldset>
							<legend className="blocks-base-control__label">
								{ __( 'Background color', 'gutenpride' ) }
							</legend>
							<ColorPalette // Element Tag for Gutenberg standard colour selector
								onChange={ onChangeBGColor } // onChange event callback
							/>
						</fieldset>
						<fieldset>
							<legend className="blocks-base-control__label">
								{ __( 'Text color', 'gutenpride' ) }
							</legend>
							<ColorPalette // Element Tag for Gutenberg standard colour selector
								onChange={ onChangeTextColor } // onChange event callback
							/>
						</fieldset>
					</div>
				</InspectorControls>
				<TextControl
					value={ attributes.message }
					onChange={ ( val ) => setAttributes( { message: val } ) }
					style={ {
						backgroundColor: attributes.bg_color,
						color: attributes.text_color,
					} }
				/>
			</div>
		);
	},
	save: ( { attributes } ) => {
		return (
			<div
				{ ...useBlockProps.save() }
				style={ {
					backgroundColor: attributes.bg_color,
					color: attributes.text_color,
				} }
			>
				{ attributes.message }
			</div>
		);
	},
} );
```

Block controls rendered in both the toolbar and sidebar will also be used when
multiple blocks of the same type are selected.

**Note :** In the example above, we added text and background color customization support to our block to demonstrate the use of `InspectorControls` to add custom controls to the sidebar. That said, for common customization settings including color, border, spacing customization and more, we will see on the [next chapter](/docs/how-to-guides/block-tutorial/block-supports-in-static-blocks.md) that you can rely on block supports to provide the same functionality in a more efficient way.

-----



WordPress provides a lot of built-in components that can be used to define the interface of the block in the editor. These built-in components are available via NPM packages such as `@wordpress/components` or `@wordpress/block-editor`.

<!-- BEGIN fix class -->
<div class="callout">
The WordPress Gutenberg project uses <a href="https://wordpress.github.io/gutenberg/?path=/docs/docs-introduction--page">Storybook</a> to document the UI components available from WordPress packages.
</div>

```js
import { useBlockProps, RichText } from '@wordpress/block-editor';

const Edit = ( props ) => {
	const {
		attributes: { content },
		setAttributes,
	} = props;

	const blockProps = useBlockProps();

	const onChangeContent = ( newContent ) => {
		setAttributes( { content: newContent } );
	};
	return (
		<RichText
			{ ...blockProps }
			tagName="p"
			onChange={ onChangeContent }
			value={ content }
		/>
	);
};
export default Edit;
```

_See the [full block example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/block-supports-6aa4dd) of the [code above](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/block-supports-6aa4dd/src/edit.js)_


## Built-in components

The package `@wordpress/components` includes a library of generic WordPress components to create common UI elements for the Block Editor and the WordPress dashboard. Some of the components most commonly used from this package are:
- `TextControl` 
- `PanelBody` & `PanelRow`
- `ToggleControl`
- `ExternalLink`

The package `@wordpress/block-editor` includes a library of components and hooks for the Block Editor, including those to define custom settings controls for the block in the Editor. Some of the components most commonly used from this package are:
- `RichText`
- `BlockControls`
- `InspectorControls`
- `InnerBlocks`
- `PanelColorSettings`


The package `@wordpress/block-editor` also provide the tools to create and use standalone block editors.

------


Use as much core stuff as possible - Check core UIs before building something custom
