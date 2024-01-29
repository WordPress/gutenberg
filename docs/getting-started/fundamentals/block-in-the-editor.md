# The block in the Editor

The Block Editor is a React Single Page Application (SPA) and every block in the editor is displayed through a React component defined in the `edit` property of the settings object used to [register the block on the client](https://developer.wordpress.org/block-editor/getting-started/fundamentals/registration-of-a-block/#registration-of-the-block-with-javascript-client-side). 

The `props` object received by the block's `Edit` React component includes:

- [`attributes`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#attributes) - attributes object
- [`setAttributes`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#setattributes) - method to update the attributes object
- [`isSelected`](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/#isselected) - boolean that communicates whether the block is currently selected

WordPress provides many built-in standard components that can be used to define the interface of the block in the editor. These built-in components are available via packages such as [`@wordpress/components`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-components/) and [`@wordpress/block-editor`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/).

<div class="callout">
The WordPress Gutenberg project uses <a href="https://wordpress.github.io/gutenberg/?path=/docs/docs-introduction--page">Storybook</a> to document the user interface components that are available in WordPress packages.
</div>

Custom settings controls for the block in the Block Toolbar or the Settings Sidebar can also be defined through this `Edit` React component via built-in components such as:

- [`InspectorControls`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inspector-controls/README.md) 
- [`BlockControls`](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-editor/src/components/block-controls) 

## Built-in components

The package [`@wordpress/components`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-components/) includes a library of generic WordPress components to create common UI elements for the Block Editor and the WordPress dashboard. Some of the  most commonly used components from this package are:

- [`TextControl`](https://wordpress.github.io/gutenberg/?path=/docs/components-textcontrol--docs) 
- [`Panel`](https://wordpress.github.io/gutenberg/?path=/docs/components-panel--docs)
- [`ToggleControl`](https://wordpress.github.io/gutenberg/?path=/docs/components-togglecontrol--docs)
- [`ExternalLink`](https://wordpress.github.io/gutenberg/?path=/docs/components-externallink--docs)

The package [`@wordpress/block-editor`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/) includes a library of components and hooks for the Block Editor, including those to define custom settings controls for the block in the Editor. Some of the components most commonly used from this package are:

- [`RichText`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/rich-text/README.md)
- [`BlockControls`](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-editor/src/components/block-controls)
- [`InspectorControls`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inspector-controls/README.md)
- [`InnerBlocks`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inner-blocks/README.md)
- `PanelColorSettings` or `ColorPalette`

<div class="callout callout-tip">
The package <a href="https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/"><code>@wordpress/block-editor</code></a> also provide the tools to create and use standalone block editors.
</div>

A good workflow when using a component for the Block Editor is:

- Import the component from a WordPress package
- Add the corresponding code for the component to your project in JSX format
- Most built-in components will be used to set [block attributes](https://developer.wordpress.org/block-editor/getting-started/fundamentals/block-json/#using-attributes-to-store-block-data), so define any necessary attributes in `block.json` and create event handlers to update those attributes with `setAttributes` in your component
- If needed, adapt the code to be serialized and stored in the database

## Block Controls: Block Toolbar and Settings Sidebar

To simplify block customization and ensure a consistent experience for users, there are a number of built-in UI patterns to help generate the editor preview. 

![Diagram showing the Block Toolbar and the Settings Sidebar when a Paragraph block is selected](https://developer.wordpress.org/files/2023/12/block-toolbar-settings-sidebar.png)

### Block Toolbar

When the user selects a block, a number of control buttons may be shown in a toolbar above the selected block. Some of these block-level controls may be included automatically but you can also customize the toolbar to include controls specific to your block type. If the return value of your block type's `edit` function includes a `BlockControls` element, those controls will be shown in the selected block's toolbar.

```jsx
export default function Edit( { className, attributes: attr, setAttributes } ) {

	const onChangeContent = ( newContent ) => {
		setAttributes( { content: newContent } );
	};

	const onChangeAlignment = ( newAlignment ) => {
		setAttributes( {
			alignment: newAlignment === undefined ? 'none' : newAlignment,
		} );
	};

	return (
		<div { ...useBlockProps() }>
			<BlockControls>
				<ToolbarGroup>
					<AlignmentToolbar
						value={ attr.alignment }
						onChange={ onChangeAlignment }
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

_See the [full block example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/block-toolbar-ab967f) of the [code above](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/block-toolbar-ab967f/src/edit.js)._


Note that `BlockControls` is only visible when the block is currently selected and in visual editing mode. `BlockControls` are not shown when editing a block in HTML editing mode.

### Settings Sidebar

The Settings Sidebar is used to display less-often-used settings or settings that require more screen space. The Settings Sidebar should be used for **block-level settings only**.

If you have settings that affects only selected content inside a block (example: the "bold" setting for selected text inside a paragraph): **do not place it inside the Settings Sidebar**. The Settings Sidebar is displayed even when editing a block in HTML mode, so it should only contain block-level settings.

The Block Tab is shown in place of the Document Tab when a block is selected.

Similar to rendering a toolbar, if you include an `InspectorControls` element in the return value of your block type's `edit` function, those controls will be shown in the Settings Sidebar region.

```jsx
export default function Edit( { attributes, setAttributes } ) {
	const onChangeBGColor = ( hexColor ) => {
		setAttributes( { bg_color: hexColor } );
	};

	const onChangeTextColor = ( hexColor ) => {
		setAttributes( { text_color: hexColor } );
	};

	return (
		<div { ...useBlockProps() }>
			<InspectorControls key="setting">
				<div>
					<fieldset>
						<legend className="blocks-base-control__label">
							{ __( 'Background color', 'block-development-examples' ) }
						</legend>
						<ColorPalette // Element Tag for Gutenberg standard colour selector
							onChange={ onChangeBGColor } // onChange event callback
						/>
					</fieldset>
					<fieldset>
						<legend className="blocks-base-control__label">
							{ __( 'Text color', 'block-development-examples' ) }
						</legend>
						<ColorPalette
							onChange={ onChangeTextColor }
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
}
```
_See the [full block example](https://github.com/WordPress/block-development-examples/tree/trunk/plugins/settings-sidebar-82c525) of the [code above](https://github.com/WordPress/block-development-examples/blob/trunk/plugins/settings-sidebar-82c525/src/edit.js)._

Block controls rendered in both the toolbar and sidebar will also be used when multiple blocks of the same type are selected.

<div class="callout callout-note">
For common customization settings including color, border, spacing customization and more, you can rely on <a href="https://developer.wordpress.org/block-editor/getting-started/fundamentals/block-json/#enable-ui-settings-panels-for-the-block-with-supports">block supports</a> to provide the same functionality in a more efficient way.
</div>

## Additional resources

- [Storybook for WordPress components](https://wordpress.github.io/gutenberg/?path=/docs/docs-introduction--page)
- [@wordpress/block-editor](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-block-editor/)
- [@wordpress/components](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-components/)
- [`Inspector Controls`](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/inspector-controls/README.md)
- [`BlockControls`](https://github.com/WordPress/gutenberg/tree/trunk/packages/block-editor/src/components/block-controls)