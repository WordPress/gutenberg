# Tools

To simplify block customization and ensure a consistent experience for users, there are a number of built-in UI patterns to help generate the editor preview. These common tools are offered under the `wp.blocks` global. In this section, we'll explore `editable`, `toolbars`, and the block `inspector`.

## Editable

At the core of rich text formatting in Gutenberg lies the `Editable` component. It's a wrapper and controller around the TinyMCE library, and can be used by any block to power any rich text editing features. It us used for captions under images or embeds, for the separate fields in a quote, etc.

<ul>
	<li><strong>Type:</strong> <code>Function</code></li>
</ul>

{% codetabs %}
{% ES5 %}
```js
var Editable = wp.blocks.Editable;

// Within registerBlockType
edit: function( props ) {
	var content = props.attributes.content;

	function onChangeContent( newContent ) {
		props.setAttributes( { content: newContent } );
	}

	return el(
		<Editable,
		{
			tagName: 'p',
			value: content,
			onChange: onChangeContent,
		}
	);
}
```
{% ESNext %}
```js
const Editable = wp.blocks.Editable;

// Within registerBlockType
edit( { attributes } ) {
	const { content } = attributes;

	return (
		<Editable
			tagName="p"
			value={ attributes.content }
			onChange={ ( value ) => setAttributes( { content: value } ) }
		/>
	);
}
```
{% end %}

This is a very straighforward usage,

```js
import Editable from '../../editable';

edit( { attributes, className, focus } ) {
	return (
		<div className={ className }>
			<p>{ attributes.content }</p>
			<Editable
				tagName="figcaption"
				placeholder={ __( 'Write caption…' ) }
				value={ caption }
				focus={ focus && focus.editable === 'caption' ? focus : undefined }
				onFocus={ focusCaption }
				onChange={ ( value ) => setAttributes( { caption: value } ) }
				inlineToolbar
			/>
		</div>
	);
}
```

`Editable` is quite powerful and can be configured through different props and events.

### tagName (optional)

...

### value

...

### placeholder (optional)

You can use this property to render placeholder text in the field.

### inlineToolbar

This is a `boolean` property.

### focus

...

### onChange

...

### onFocus

...

## Toolbar

<img src="https://cldup.com/jUslj672CK.png" width="391" height="79" alt="toolbar">

When the user selects a block, a number of control buttons may be shown in a toolbar above the selected block. Some of these block-level controls are included automatically if the editor is able to transform the block to another type, or if the focused element is an Editable component.

### BlockControls

You can also customize the toolbar to include controls specific to your block type. If the return value of your block type's `edit` function includes a `BlockControls` element, those controls will be shown in the selected block's toolbar.

{% codetabs %}
{% ES5 %}
```js
var el = wp.element.createElement,
	registerBlockType = wp.blocks.registerBlockType,
	Editable = wp.blocks.Editable,
	BlockControls = wp.blocks.BlockControls,
	AlignmentToolbar = wp.blocks.AlignmentToolbar,
	children = wp.blocks.source.children;

registerBlockType( 'gutenberg-boilerplate-es5/hello-world-step-04', {
	title: 'Hello World (Step 4)',

	icon: 'universal-access-alt',

	category: 'layout',

	attributes: {
		content: {
			type: 'array',
			source: children( 'p' )
		}
	},

	edit: function( props ) {
		var content = props.attributes.content,
			alignment = props.attributes.alignment,
			focus = props.focus;

		function onChangeContent( newContent ) {
			props.setAttributes( { content: newContent } );
		}

		function onChangeAlignment( newAlignment ) {
			props.setAttributes( { alignment: newAlignment } );
		}

		return [
			!! focus && el(
				BlockControls,
				{ key: 'controls' },
				el(
					AlignmentToolbar,
					{
						value: alignment,
						onChange: onChangeAlignment
					}
				)
			),
			el(
				Editable,
				{
					key: 'editable',
					tagName: 'p',
					className: props.className,
					style: { textAlign: alignment },
					onChange: onChangeContent,
					value: content,
					focus: focus,
					onFocus: props.setFocus
				}
			)
		];
	},

	save: function( props ) {
		var content = props.attributes.content;

		return el( 'p', { className: props.className }, content );
	},
} );
```
{% ESNext %}
```js
const {
	registerBlockType,
	Editable,
	BlockControls,
	AlignmentToolbar,
	source
} = wp.blocks;
const { children } = source;

registerBlockType( 'gutenberg-boilerplate-esnext/hello-world-step-04', {
	title: 'Hello World (Step 4)',

	icon: 'universal-access-alt',

	category: 'layout',

	attributes: {
		content: {
			type: 'array',
			source: children( 'p' ),
		},
	},

	edit( { attributes, setAttributes, focus } ) {
		const { content, alignment } = attributes;

		function onChangeContent( newContent ) {
			setAttributes( { content: newContent } );
		}

		function onChangeAlignment( newAlignment ) {
			setAttributes( { alignment: newAlignment } );
		}

		return [
			!! focus && (
				<BlockControls key="controls">
					<AlignmentToolbar
						value={ alignment }
						onChange={ onChangeAlignment }
					/>
				</BlockControls>
			),
			<Editable
				key="editable"
				tagName="p"
				className={ props.className }
				style={ { textAlign: alignment } }
				onChange={ onChangeContent }
				value={ content }
				focus={ focus }
				onFocus={ props.setFocus }
			/>
		];
	},

	save( { attributes, className } ) {
		const { content } = attributes;

		return <p className={ className }>{ content }</p>;
	},
} );
```
{% end %}

Note that you should only include `BlockControls` if the block is currently selected. We must test that the `focus` value is truthy before rendering the element, otherwise you will inadvertently cause controls to be shown for the incorrect block type.

### BlockAlignmentToolbar

...

## Inspector

While the toolbar area is useful for displaying controls to toggle attributes of a block, sometimes a block needs to include extra functionality and settings that are not appropriate to show on the block itself or that require more screen space. Gutenberg includes a block inspector region in the sidebar for this purpose.

### InspectorControls

Similar to rendering a toolbar, if you include an `InspectorControls` element in the return value of your block type's `edit` function, those controls will be shown in the inspector region. All the children passed to this component will appear in the sidebar when the tab and the corresponding block are selected.

### BlockDescription

A block can display a short text describing what its purpose is. It is recommended to always include one when using the inspector.

# Components

In order to make it easier to create sophisticated blocks quickly, reducing the amount of work you have to do to develop common functionality, several components have been created which can be accessed through the `wp.components` global. This section covers the available UI components.

## Placeholder

Certain blocks, like media ones, have a state where they don't yet have user data filled but could be rendering something.

## CheckboxControl

...

## RadioControl

...

## RangeControl

...

## SelectControl

...

## TextControl

...

## TextareaControl

...

## ToggleControl

...

## MediaUploadButton

...

## FormFileUpload

...

## ColorPalette

...

## DropdownMenu

...

## Button

...

## IconButton

...

## Popover

...

## Tooltip

...

## Dashicon

...
