
# Authoring Experience

## Background

One of the primary tenets of Gutenberg is as a WYSIWYG editor, what you see in the editor, should be as close to what you get when published. Keep this in mind when building blocks.

## Placeholder

The state when a block has been inserted, but no data has been entered yet, is called a placeholder. There is a `Placeholder` component built that gives us a standard look. You can see example placeholders in use with the image and embed blocks.

To use the Placeholder, wrap the `<TextControl>` component so it becomes a child element of the `<Placeholder>` component. Try it out in your code. After updating, you might have something like:

```jsx
import { Placeholder, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit( { attributes, className, setAttributes } ) {
    return (
        <div className={ className }>
			<Placeholder
			  label="Gutenpride Block"
			  instructions="Add your message"
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
  ( clause ) ? ( doIfTrue ) : ( doIfFalse )
```

This can be used inside a block to control what shows when a parameter is set or not. A simple case that checks if the `message` is set might look like:

```jsx
  return (
    <div>
      { attributes.message ?
        <div> Message: { attributes.message }</div> :
        <div> No Message <TextField/> </div>
      }
  );
```

If we only used the above check, as soon as we type anything, the textfield would disappear since the message would be set. So we need to pair with the `isSelected` parameter.

The `isSelected` parameter is passed in to the `edit` function and is set to true if the block is selected in the editor (currently editing) otherwise set to false (editing elsewhere).

Using that parameter, we can use the logic:

```js
attributes.message && ! isSelected
```

If the message is set and `!isSelected`, meaning we are not editing the block, the focus is elsewhere, then display the message not the text field.

All so this combined together here's what the edit function looks like this:

```jsx
import { Placeholder, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit( { attributes, className, isSelected, setAttributes } ) {
    return (
        <div>
        { attributes.message && !isSelected ?
            <div className={ className }>
                { attributes.message }
            </div> :
			<Placeholder
			  label="Gutenpride Block"
			  instructions="Add your message"
			>
			  <TextControl
			    value={ attributes.message }
			    onChange={ ( val ) => setAttributes( { message: val } ) }
			  />
            </Placeholder>
        }
        </div>
    );
}
```

With that in place, rebuild and reload and when you are not editing the message is displayed as it would be for the view, when you click into the block you see the text field.

## A Better Solution

Replacing the Placeholder and TextControl when it is selected or not is jarring and not an ideal situation for this block. This was mainly used to illustrate what can be done depending on your block. It is important to think about the author's experience using the block.

The simpler and better solution is to modify the editor.css to include the proper style for the textfield, this will give the stylized text while typing.

Update `editor.css` to:

```css
.wp-block-create-block-gutenpride input[type="text"] {
	font-family: Gilbert;
	font-size: 64px;
}
```

The edit function can simply be:

```jsx
import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Edit( { attributes, className, setAttributes } ) {
    return (
        <TextControl
            className={ className }
            value={ attributes.message }
            onChange={ ( val ) => setAttributes( { message: val } ) }
        />
    );
}
```
