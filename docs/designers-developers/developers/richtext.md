# RichText Reference

RichText is a component that allows developers to render a [`contenteditable` input](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Editable_content), providing users with the option to format block content to make it bold, italics, linked, or use other formatting.

The RichText component is extremely powerful because it provides built-in functionality you won't find in other components:

* **Consistent Styling in the Admin and Frontend:** The editable container can be set to any block-level element, such as a `div`, `h2` or `p` tag. This allows the styles you apply in style.css to more easily apply on the frontend and admin, without having to rewrite them in editor.css.
* **Cohesive Placeholder Text:** Before the user writes their content, it's easy to include placeholder text that's already styled to match the rest of the block editor.
* **Control Over Formatting Options:** It's possible to dictate exactly which formatting options you want to allow for the RichText field. For example, you can dictate whether to allow the user to make text bold, italics or both.

Unlike other components that exist in the [Component Reference](/packages/components/README.md) section, RichText lives separately because it only makes sense within the block editor, and not within other areas of WordPress.

## Property Reference

For a list of the possible properties to pass your RichText component, [check out the component documentation on Github](https://github.com/WordPress/gutenberg/blob/master/packages/block-editor/src/components/rich-text/README.md).

## Core Blocks Using the RichText Component

There are a number of core blocks using the RichText component. The JavaScript edit function linked below for each block can be used as a best practice reference while creating your own blocks.

* **[Button](https://github.com/WordPress/gutenberg/blob/master/packages/block-library/src/button/edit.js):** RichText is used to enter the button's text.
* **[Heading](https://github.com/WordPress/gutenberg/blob/master/packages/block-library/src/heading/edit.js):** RichText is used to enter the heading's text.
* **[Quote](https://github.com/WordPress/gutenberg/blob/master/packages/block-library/src/quote/edit.js):** RichText is used in two places, for both the quotation and citation text.
* **[Search](https://github.com/WordPress/gutenberg/blob/master/packages/block-library/src/search/edit.js):** RichText is used in two places, for both the label above the search field and the submit button text.

## Example

{% codetabs %}
{% ES5 %}
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
		return wp.element.createElement( wp.editor.RichText, {
			tagName: 'h2',  // The tag here is the element output and editable in the admin
			className: props.className,
			value: props.attributes.content, // Any existing content, either from the database or an attribute default
			formattingControls: [ 'bold', 'italic' ], // Allow the content to be made bold or italic, but do not allow other formatting options
			onChange: function( content ) {
				props.setAttributes( { content: content } ); // Store updated content as a block attribute
			},
			placeholder: __( 'Heading...' ), // Display this text before any content has been added by the user
		} );
	},

	save: function( props ) {
		return wp.element.createElement( wp.editor.RichText.Content, {
			tagName: 'h2', value: props.attributes.content // Saves <h2>Content added in the editor...</h2> to the database for frontend display
		} );
	}
} );
```
{% ESNext %}
```js
const { registerBlockType } = wp.blocks;
const { RichText } = wp.editor;

registerBlockType( /* ... */, {
	// ...

	attributes: {
		content: {
			type: 'string',
			source: 'html',
			selector: 'h2',
		},
	},

	edit( { className, attributes, setAttributes } ) {
		return (
			<RichText
				tagName="h2" // The tag here is the element output and editable in the admin
				className={ className }
				value={ attributes.content } // Any existing content, either from the database or an attribute default
				formattingControls={ [ 'bold', 'italic' ] } // Allow the content to be made bold or italic, but do not allow other formatting options
				onChange={ ( content ) => setAttributes( { content } ) } // Store updated content as a block attribute
				placeholder={ __( 'Heading...' ) } // Display this text before any content has been added by the user
			/>
		);
	},

	save( { attributes } ) {
		return <RichText.Content tagName="h2" value={ attributes.content } />; // Saves <h2>Content added in the editor...</h2> to the database for frontend display
	}
} );
```
{% end %}

## Common Issues & Solutions

While using the RichText component a number of common issues tend to appear.

### Placeholder Content Separates from the Input

In some cases the placeholder content on RichText can appear separate from the input where you would write your content. This is likely due to one of two reasons:

1. You can't use an [inline HTML element](https://developer.mozilla.org/en-US/docs/Web/HTML/Inline_elements) as the RichText component. If your `tagName` property is using an inline element such as `span`, `a` or `code`, it needs to be changed to a [block-level element](https://developer.mozilla.org/en-US/docs/Web/HTML/Block-level_elements).
2. The `position` CSS property value for the element must be set to `relative` or `absolute` within the admin. If the styles within style.css or editor.css modify the `position` property value for this element, you may see issues with how it displays.

### HTML Formatting Tags Display in the Content

If the HTML tags from text formatting such as `<strong>` or `<em>` are being escaped and displayed on the frontend of the site, this is likely due to an issue in your save function. Make sure your code looks something like `<RichText.Content tagName="h2" value={ heading } />` (ESNext) within your save function instead of simply outputting the value with `<h2>{ heading }</h2>`.

### Unwanted Formatting Options Still Display

Before moving forward, consider if using the RichText component makes sense at all. Would it be better to use a basic `input` or `textarea` element? If you don't think any formatting should be possible, these HTML tags may make more sense.

If you'd still like to use RichText, you can eliminate all of the formatting options by specifying the `formattingControls` property as `formattingControls={ [] }` (ESNext). It's possible you'll continue to see formatting options for adding code, an inline image or other formatting. Don't worry, you've found an existing bug that should be fixed soon.
