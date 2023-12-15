# The block in the Editor

The Block Editor is a React Single Page Application (SPA) and every block in the editor is displayed through a React component defined in the `Edit` property of the settings object used to [register the block on the client](https://developer.wordpress.org/block-editor/getting-started/fundamentals/registration-of-a-block/#registration-of-the-block-with-javascript-client-side). 

The `props` object received by the block's `Edit` React component includes `attributes` and `setAttributes`. Custom settings controls for the block in the Editor (in the `Block Toolbar` or in the `Settings Sidebar`) can also be defined through this `Edit` React component.

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
