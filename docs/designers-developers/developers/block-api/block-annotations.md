# Annotations

**Note: This API is experimental, that means it is subject to non-backward compatible changes or removal in any future version.**

Annotations are a way to highlight a specific piece in a post created with the block editor. Examples of this include commenting on a piece of text and spellchecking. Both can use the annotations API to mark a piece of text.

## API

To see the API for yourself the easiest way is to have a block that is at least 200 characters long without formatting and putting the following in the console:

```js
wp.data.dispatch( 'core/annotations' ).addAnnotation( {
	source: "my-annotations-plugin",
	blockClientId: wp.data.select( 'core/editor' ).getBlockOrder()[0],
	richTextIdentifier: "content",
	range: {
		start: 50,
		end: 100,
	},
} );
```

The start and the end of the range should be calculated based only on the text of the relevant `RichText`. For example, in the following HTML position 0 will refer to the position before the capital S:

```html
<strong>Strong text</strong>
```

To help with determining the correct positions, the `wp.richText.create` method can be used. This will split a piece of HTML into text and formats.

All available properties can be found in the API documentation of the `addAnnotation` action.

The property `richTextIdentifier` is the identifier of the RichText instance the annotation applies to. This is necessary because blocks may have multiple rich text instances that are used to manage data for different attributes, so you need to pass this in order to highlight text within the correct one.

For example the Paragraph block only has a single RichText instance, with the identifer `content`. The quote block type has 2 RichText instances, so if you wish to highlight text in the citation, you need to pass `citation` as the `richTextIdentifier` when adding an annotation. To target the quote content, you need to use the identifier `value`. Refer to the source code of the block type to find the correct identifier.

## Block annotation

It is also possible to annotate a block completely. In that case just provide the `selector` property and set it to `block`. The default `selector` is `range`, which can be used for text annotation.

```js
wp.data.dispatch( 'core/annotations' ).addAnnotation( {
	source: "my-annotations-plugin",
	blockClientId: wp.data.select( 'core/editor' ).getBlockOrder()[0],
	selector: "block",
} );
```

This doesn't provide any styling out of the box, so you have to provide some CSS to make sure your annotation is shown:

```css
.is-annotated-by-my-annotations-plugin {
	outline: 1px solid black;
}
```

## Text annotation

The text annotation is controlled by the `start` and `end` properties. Simple `start` and `end` properties don't work for HTML, so these properties are assumed to be offsets within the `rich-text` internal structure. For simplicity you can think about this as if all HTML would be stripped out and then you calculate the `start` and the `end` of the annotation.
