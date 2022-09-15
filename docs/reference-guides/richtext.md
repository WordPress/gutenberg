# RichText Reference

RichText is a component that allows developers to render a [`contenteditable` input](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Editable_content), providing users with the option to format block content to make it bold, italics, linked, or use other formatting.

The RichText component is extremely powerful because it provides built-in functionality you won't find in other components:

-   **Consistent Styling in the Admin and Frontend:** The editable container can be set to any block-level element, such as a `div`, `h2` or `p` tag. This allows the styles you apply in style.css to more easily apply on the frontend and admin, without having to rewrite them in editor.css.
-   **Cohesive Placeholder Text:** Before the user writes their content, it's easy to include placeholder text that's already styled to match the rest of the block editor.
-   **Control Over Formatting Options:** It's possible to dictate exactly which formatting options you want to allow for the RichText field. For example, you can dictate whether to allow the user to make text bold, italics or both.

Unlike other components that exist in the [Component Reference](/packages/components/README.md) section, RichText lives separately because it only makes sense within the block editor, and not within other areas of WordPress.

## Property Reference

For a list of the possible properties to pass your RichText component, [check out the component documentation on GitHub](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/rich-text/README.md).

## Core Blocks Using the RichText Component

There are a number of core blocks using the RichText component. The JavaScript edit function linked below for each block can be used as a best practice reference while creating your own blocks.

-   **[Button](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-library/src/button/edit.js):** RichText is used to enter the button's text.
-   **[Heading](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-library/src/heading/edit.js):** RichText is used to enter the heading's text.
-   **[Quote](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-library/src/quote/edit.js):** RichText is used in two places, for both the quotation and citation text.
-   **[Search](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-library/src/search/edit.js):** RichText is used in two places, for both the label above the search field and the submit button text.

## Example

{% codetabs %}
{% JSX %}

```jsx
import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, RichText } from '@wordpress/block-editor';

registerBlockType( /* ... */, {
	// ...

	attributes: {
		content: {
			type: 'string',
			source: 'html',
			selector: 'h2',
		},
	},

	edit( { attributes, setAttributes } ) {
		const blockProps = useBlockProps();

		return (
			<RichText
				{ ...blockProps }
				tagName="h2" // The tag here is the element output and editable in the admin
				value={ attributes.content } // Any existing content, either from the database or an attribute default
				allowedFormats={ [ 'core/bold', 'core/italic' ] } // Allow the content to be made bold or italic, but do not allow other formatting options
				onChange={ ( content ) => setAttributes( { content } ) } // Store updated content as a block attribute
				placeholder={ __( 'Heading...' ) } // Display this text before any content has been added by the user
			/>
		);
	},

	save( { attributes } ) {
		const blockProps = useBlockProps.save();

		return <RichText.Content { ...blockProps } tagName="h2" value={ attributes.content } />; // Saves <h2>Content added in the editor...</h2> to the database for frontend display
	}
} );
```

{% Plain %}

```js
wp.blocks.registerBlockType( /* ... */, {
	// ...

	attributes: {
		content: {
			type: 'string',
			source: 'html',
			selector: 'h2',
		},
	},

	edit: function( props ) {
		var blockProps = wp.blockEditor.useBlockProps();

		return wp.element.createElement( wp.blockEditor.RichText, Object.assign( blockProps, {
			tagName: 'h2',  // The tag here is the element output and editable in the admin
			value: props.attributes.content, // Any existing content, either from the database or an attribute default
			allowedFormats: [ 'core/bold', 'core/italic' ], // Allow the content to be made bold or italic, but do not allow other formatting options
			onChange: function( content ) {
				props.setAttributes( { content: content } ); // Store updated content as a block attribute
			},
			placeholder: __( 'Heading...' ), // Display this text before any content has been added by the user
		} ) );
	},

	save: function( props ) {
		var blockProps = wp.blockEditor.useBlockProps.save();

		return wp.element.createElement( wp.blockEditor.RichText.Content, Object.assign( blockProps, {
			tagName: 'h2', value: props.attributes.content // Saves <h2>Content added in the editor...</h2> to the database for frontend display
		} ) );
	}
} );
```

{% end %}

## Common Issues & Solutions

While using the RichText component a number of common issues tend to appear.

### HTML Formatting Tags Display in the Content

If the HTML tags from text formatting such as `<strong>` or `<em>` are being escaped and displayed on the frontend of the site, this is likely due to an issue in your save function. Make sure your code looks something like `<RichText.Content tagName="h2" value={ heading } />` (JSX) within your save function instead of simply outputting the value with `<h2>{ heading }</h2>`.

### Unwanted Formatting Options Still Display

Before moving forward, consider if using the RichText component makes sense at all. Would it be better to use a basic `input` or `textarea` element? If you don't think any formatting should be possible, these HTML tags may make more sense.

If you'd still like to use RichText, you can eliminate all of the formatting options by specifying the `withoutInteractiveFormatting` property.

If you want to limit the formats allowed, you can specify using `allowedFormats` property in your code, see the example above or [the component documentation](https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/rich-text/README.md#allowedformats-array) for details.

### Disable Specific Format Types in Editor

The RichText component uses formats to display inline elements, for example images within the paragraph block. If you just want to disable a format from the editor, you can use the `unregisterFormatType` function. For example to disable inline images, use:

```
wp.richText.unregisterFormatType( 'core/image' );
```

To apply, you would need to enqueue the above script in your plugin or theme. See the JavaScript tutorial for [how to load JavaScript in WordPress](https://developer.wordpress.org/block-editor/how-to-guides/javascript/loading-javascript/).
