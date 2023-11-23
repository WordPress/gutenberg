# The block in the Editor

The Block Editor is a React Single Page Application (SPA) and every block in the editor is displayed through a React component. 
changes in blocks --- update store --- update blocks

A block actually manages two main interfaces that are registered in the form of React components on the client through the `registerBlockType`:
- The `edit` React component that defines how the block is displayed in the Block Editor and its behavior.
- The `save` React component that defines how the block is stored in the DB

The `edit` React component of a block receives a `props` object which includes `attributes` and `setAttributes`

The block wrapper element needs to include `props` from `useBlockProps` to include its classes and atributes properly:
- any custom attributes (like extra classes) should be passed as an argument of `useBlockProps`
- When you add `support` for any feature, they get added to the object returned by the `useBlockProps` hook.


This "edit" interface can also define custom setting controls for the block in the Editor:  `Block Toolbar` and `Settings Sidebar`

Wordpress offers a lot of built-in components via NPM packages to define the interface of the block in the editor, like `@wordpress/components` or `@wordpress/block-editor`

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

Use as much core stuff as possible - Check core UIs before building something custom

The WordPress Gutenberg project uses [Storybook](https://wordpress.github.io/gutenberg/?path=/docs/docs-introduction--page) to view and work with the UI components developed in WordPress packages, especially 

`@wordpress/components` includes a library of generic WordPress components to be used for creating common UI elements shared between screens and features of the WordPress dashboard.
- `TextControl`
- `PanelBody` & `PanelRow`
- `ToggleControl`
- `ExternalLink`

`@wordpress/block-editor` includes a library of components and hooks for the Block Editor. This module allows you to create and use standalone block editors.
- `RichText`
- `BlockControls`
- `InspectorControls`
- `InnerBlocks`
- `PanelColorSettings`
