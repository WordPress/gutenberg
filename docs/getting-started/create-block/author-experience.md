# Authoring Experience

## Background

One of the primary tenets of Gutenberg as a WYSIWYG editor is that what you see in the editor should be as close as possible to what you get when published. Keep this in mind when building blocks.

## Placeholder

The state when a block has been inserted, but no data has been entered yet, is called a placeholder. There is a `Placeholder` component built that gives us a standard look. You can see example placeholders in use with the image and embed blocks.

To use the Placeholder, wrap the `<TextControl>` component so it becomes a child element of the `<Placeholder>` component. Try it out in your code. After updating, you might have something like:

```jsx
import { Placeholder, TextControl } from '@wordpress/components';
import { useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function Edit( { attributes, className, setAttributes } ) {
	return (
		<div { ...useBlockProps() }>
			<Placeholder
				label={ __( 'Gutenpride Block', 'gutenpride' ) }
				instructions={ __( 'Add your message', 'gutenpride' ) }
			>
				<TextControl
					value={ attributes.message }
					onChange={ ( val ) => setAttributes( { message: val } ) }
				/>
			</Placeholder>
		</div>
	);
}
```

## isSelected Ternary Function

The placeholder looks ok, for a simple text message it may or may not be what you are looking for. However, the placeholder can be useful if you are replacing the block after what is typed in, similar to the embed blocks.

For this we can use a ternary function, to display content based on a value being set or not. A ternary function is an inline if-else statement, using the syntax:

```js
clause ? doIfTrue : doIfFalse;
```

This can be used inside a block to control what shows when a parameter is set or not. A simple case that displays a `message` if set, otherwise show the form element:

```jsx
return (
	<div { ...useBlockProps() }>
		{ attributes.message ? (
			<div>Message: { attributes.message }</div>
		) : (
			<div>
				<p>No Message.</p>
				<TextControl
					value={ attributes.message }
					onChange={ ( val ) => setAttributes( { message: val } ) }
				/>
			</div>
		) }
	</div>
);
```

There is a problem with the above, if we only use the `attributes.message` check, as soon as we type in the text field it would disappear since the message would then be set to a value. So we need to pair with an additional `isSelected` parameter.

The `isSelected` parameter is passed in to the `edit` function and is set to true if the block is selected in the editor (currently editing) otherwise set to false (editing elsewhere).

Using that parameter, we can use the logic:

```js
attributes.message && ! isSelected;
```

If the message is set and `!isSelected`, meaning we are not editing the block, the focus is elsewhere, then display the message not the text field.

All of this combined together, here's what the edit function looks like:

```jsx
import { Placeholder, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit( { attributes, isSelected, setAttributes } ) {
	return (
		<div { ...useBlockProps() }>
			{ attributes.message && ! isSelected ? (
				<div>{ attributes.message }</div>
			) : (
				<Placeholder
					label="Gutenpride Block"
					instructions="Add your message"
				>
					<TextControl
						value={ attributes.message }
						onChange={ ( val ) =>
							setAttributes( { message: val } )
						}
					/>
				</Placeholder>
			) }
		</div>
	);
}
```

With that in place, rebuild and reload and when you are not editing the message is displayed as it would be for the view, when you click into the block you see the text field.

## A Better Solution

The switching between a Placeholder and input control works well with a visual element like an image or video, but for the text example in this block we can do better.

The simpler and better solution is to modify the `src/editor.scss` to include the proper stylized text while typing.

Update `src/editor.scss` to:

```scss
.wp-block-create-block-gutenpride input[type='text'] {
	font-family: Gilbert;
	font-size: 64px;
	color: inherit;
	background: inherit;
	border: 0;
}
```

The edit function can simply be:

```jsx
import { useBlockProps } from '@wordpress/block-editor';
import { TextControl } from '@wordpress/components';

import './editor.scss';

export default function Edit( { attributes, setAttributes } ) {
	return (
		<TextControl
			{ ...useBlockProps() }
			value={ attributes.message }
			onChange={ ( val ) => setAttributes( { message: val } ) }
		/>
	);
}
```

Next Section: [Finishing Touches](/docs/getting-started/create-block/finishing.md)
