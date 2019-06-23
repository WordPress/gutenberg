# Attributes

## Common Sources

Attribute sources are used to define how the block attribute values are extracted from saved post content. They provide a mechanism to map from the saved markup to a JavaScript representation of a block.

If no attribute source is specified, the attribute will be saved to (and read from) the block's [comment delimiter](/docs/designers-developers/key-concepts.md#delimiters-and-parsing-expression-grammar).

The keys specified in the attributes source object are named as you see fit. The result of the attribute source definition is assigned as a value to each key.

If no selector argument is specified, the source definition runs against the block's root node. If a selector argument is specified, it will run against the specified element(s) contained within the block.

The selector specified can be an HTML tag, or anything queryable such as a class or id attribute, see examples below.

Under the hood, attribute sources are a superset of the functionality provided by [hpq](https://github.com/aduth/hpq), a small library used to parse and query HTML markup into an object shape.


### `attribute`

Use `attribute` to extract the value of an attribute from markup.

_Example_: Extract the `src` attribute from an image found in the block's markup.

```js
{
	url: {
		type: 'string',
		source: 'attribute',
		selector: 'img',
		attribute: 'src',
	}
}
// { "url": "https://lorempixel.com/1200/800/" }
```

#### `attribute` Type Validation

Accepted values in the `type` field of an `attribute` MUST be one of the following:

* null
* boolean
* object
* array
* number
* string
* integer

See [WordPress's REST API documentation](https://developer.wordpress.org/rest-api/extending-the-rest-api/schema/) for additional details.

### `text`

Use `text` to extract the inner text from markup.

```js
{
	content: {
		type: 'string',
		source: 'text',
		selector: 'figcaption',
	}
}
// { "content": "The inner text of the figcaption element" }
```

Another example, using `text` as the source, and using `.my-content` class as the selector to extract text:

```js
{
	content: {
		type: 'string',
		source: 'text',
		selector: '.my-content',
	}
}
// { "content": "The inner text of .my-content class" }
```

### `html`

Use `html` to extract the inner HTML from markup.

```js
{
	content: {
		type: 'string',
		source: 'html',
		selector: 'figcaption',
	}
}
// { "content": "The inner text of the <strong>figcaption</strong> element" }
```

Use the `multiline` property to extract the inner HTML of matching tag names for the use in `RichText` with the `multiline` prop.

```js
{
	content: {
		type: 'string',
		source: 'html',
		multiline: 'p',
		selector: 'blockquote',
	}
}
// { "content": "<p>First line</p><p>Second line</p>" }
```

### `query`

Use `query` to extract an array of values from markup. Entries of the array are determined by the selector argument, where each matched element within the block will have an entry structured corresponding to the second argument, an object of attribute sources.

_Example_: Extract `src` and `alt` from each image element in the block's markup.

```js
{
	images: {
		type: 'array',
		source: 'query'
		selector: 'img',
		query: {
			url: {
				type: 'string',
				source: 'attribute',
				attribute: 'src',
			},
			alt: {
				type: 'string',
				source: 'attribute',
				attribute: 'alt',
			},
		}
	}
}
// {
//   "images": [
//     { "url": "https://lorempixel.com/1200/800/", "alt": "large image" },
//     { "url": "https://lorempixel.com/50/50/", "alt": "small image" }
//   ]
// }
```

## Meta

Attributes may be obtained from a post's meta rather than from the block's representation in saved post content. For this, an attribute is required to specify its corresponding meta key under the `meta` key:

```js
attributes: {
	author: {
		type: 'string',
		source: 'meta',
		meta: 'author'
	},
},
```

From here, meta attributes can be read and written by a block using the same interface as any attribute:

{% codetabs %}
{% ES5 %}
```js
edit: function( props ) {
	function onChange( event ) {
		props.setAttributes( { author: event.target.value } );
	}

	return el( 'input', {
		value: props.attributes.author,
		onChange: onChange,
	} );
},
```
{% ESNext %}
```js
edit( { attributes, setAttributes } ) {
	function onChange( event ) {
		setAttributes( { author: event.target.value } );
	}

	return <input value={ attributes.author } onChange={ onChange } type="text" />;
},
```
{% end %}

### Considerations

By default, a meta field will be excluded from a post object's meta. This can be circumvented by explicitly making the field visible:

```php
function gutenberg_my_block_init() {
	register_post_meta( 'post', 'author', array(
		'show_in_rest' => true,
	) );
}
add_action( 'init', 'gutenberg_my_block_init' );
```

Furthermore, be aware that WordPress defaults to:

- not treating a meta datum as being unique, instead returning an array of values;
- treating that datum as a string.

If either behavior is not desired, the same `register_post_meta` call can be complemented with the `single` and/or `type` parameters as follows:

```php
function gutenberg_my_block_init() {
	register_post_meta( 'post', 'author_count', array(
		'show_in_rest' => true,
		'single' => true,
		'type' => 'integer',
	) );
}
add_action( 'init', 'gutenberg_my_block_init' );
```

If you'd like to use an object or an array in an attribute, you can register a `string` attribute type and use JSON as the intermediary. Serialize the structured data to JSON prior to saving, and then deserialize the JSON string on the server. Keep in mind that you're responsible for the integrity of the data; make sure to properly sanitize, accommodate missing data, etc.

Lastly, make sure that you respect the data's type when setting attributes, as the framework does not automatically perform type casting of meta. Incorrect typing in block attributes will result in a post remaining dirty even after saving (_cf._ `isEditedPostDirty`, `hasEditedAttributes`). For instance, if `authorCount` is an integer, remember that event handlers may pass a different kind of data, thus the value should be cast explicitly:

```js
function onChange( event ) {
	props.setAttributes( { authorCount: Number( event.target.value ) } );
}
```
