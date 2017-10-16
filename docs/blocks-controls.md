# Block Controls: Toolbars and Inspector

To simplify block customization and ensure a consistent experience for users, there are a number of built-in UI patterns to help generate the editor preview. Like with the `Editable` component covered in the previous chapter, the `wp.blocks` global includes a few other common components to render editing interfaces. In this chapter, we'll explore toolbars and the block inspector.

## Toolbar

<img src="https://cldup.com/jUslj672CK.png" width="391" height="79" alt="toolbar">

When the user selects a block, a number of control buttons may be shown in a toolbar above the selected block. Some of these block-level controls are included automatically if the editor is able to transform the block to another type, or if the focused element is an Editable component.

You can also customize the toolbar to include controls specific to your block type. If the return value of your block type's `edit` function includes a `BlockControls` element, those controls will be shown in the selected block's toolbar.

{% codetabs %}
{% ES5 %}
```js
var el = wp.element.createElement,
	registerBlockType = wp.blocks.registerBlockType,
	Editable = wp.blocks.Editable,
	BlockControls = wp.blocks.BlockControls,
	AlignmentToolbar = wp.blocks.AlignmentToolbar;

registerBlockType( 'gutenberg-boilerplate-es5/hello-world-step-04', {
	title: 'Hello World (Step 4)',

	icon: 'universal-access-alt',

	category: 'layout',

	attributes: {
		content: {
			type: 'array',
			source: 'children',
			selector: 'p',
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

registerBlockType( 'gutenberg-boilerplate-esnext/hello-world-step-04', {
	title: 'Hello World (Step 4)',

	icon: 'universal-access-alt',

	category: 'layout',

	attributes: {
		content: {
			type: 'array',
			source: 'children',
			selector: 'p',
		},
	},

	edit( { attributes, className, focus, setAttributes, setFocus } ) {
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
				className={ className }
				style={ { textAlign: alignment } }
				onChange={ onChangeContent }
				value={ content }
				focus={ focus }
				onFocus={ setFocus }
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

## Inspector

While the toolbar area is useful for displaying controls to toggle attributes of a block, sometimes you will find that you need more screen space for form fields. The inspector region is shown in place of the post settings sidebar when a block is selected.

Similar to rendering a toolbar, if you include an `InspectorControls` element in the return value of your block type's `edit` function, those controls will be shown in the inspector region.
