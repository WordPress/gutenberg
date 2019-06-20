# Annotations

Annotate content in the Gutenberg editor.

## Installation

Install the module

```bash
npm install @wordpress/annotations --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as lower versions of IE then using [core-js](https://github.com/zloirock/core-js) or [@babel/polyfill](https://babeljs.io/docs/en/next/babel-polyfill) will add support for these methods. Learn more about it in [Babel docs](https://babeljs.io/docs/en/next/caveats)._

## Getting Started

You need to include `wp-annotations` as a dependency of the JavaScript file in which you wish to use the Annotations API.

## Usage

### Adding an annotation

To add an annotation, you need to dispatch an `__experimentalAddAnnotation` action, passing the data

The following example code will add an annotation to a paragraph block, that highlights a portion of the text.

```js
wp.data.dispatch( 'core/annotations' ).__experimentalAddAnnotation( {
	source: 'my-plugin',
	blockClientId: 'b0702d56-bd8a-4d3b-b44c-813947a075b2',
	richTextIdentifier: 'content',
	range: {
		start: 10,
		end: 14,
	},
} );
```

Notes:

`richTextIdentifier`

This is the Identifier for the RichText instance the annotation applies to.

Blocks may have multiple rich text instances that are used to manage data for different attributes, so you need to pass this in order to highlight text within the correct one.

For example the paragraph block only has a single RichText instance, with the identifer `content`. The quote block type has 2 RichText instances, so if you wish to highlight text in the citation, you need to pass `citation` as the `richTextIdentifier` when adding an annotation. To target the quote content, you need to use the identifier `value`. Refer to the source code of the block type to find the correct identifier.
