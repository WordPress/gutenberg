# `URLInputButton`

Render a URL input button that pops up an input to search for and select a post or enter any arbitrary URL.

## Properties

### `url: String`

*Required.* This should be set to the attribute (or component state) property used to store the URL.

### `onChange( url: String, post: Object ): Function`

*Required.* Called when the value changes. The second parameter defaults to an empty object unless the user selects a post from the suggestions dropdown. In those cases the `post` parameter will look like this:

```json
{
  "id": 1,
  "subtype": "page",
  "title": "Sample Page",
  "type": "post",
  "url": "https://example.com/sample-page/",
  "_links": {
    "self": [ { "embeddable": true, "href": "https://example.com/wp-json/wp/v2/pages/1" } ],
    "about": [ { "href": "https://example.com/wp-json/wp/v2/types/page" } ],
    "collection": [ { "href": "https://example.com/wp-json/gutenberg/v1/search" } ]
  }
}
```

## Example

{% codetabs %}
{% ES5 %}
```js
wp.blocks.registerBlockType( /* ... */, {
	// ...

	attributes: {
		url: {
			type: 'string'
		},
		text: {
			type: 'string'
		}
	},

	edit: function( props ) {
		return wp.element.createElement( wp.editor.URLInputButton, {
			className: props.className,
			url: props.attributes.url,
			onChange: function( url, post ) {
				props.setAttributes( { url: url, text: post.title || 'Click here' } );
			}
		} );
	},

	save: function( props ) {
		return wp.element.createElement( 'a', {
			href: props.attributes.url,
		}, props.attributes.text );
	}
} );
```
{% ESNext %}
```js
const { registerBlockType } = wp.blocks;
const { URLInputButton } = wp.editor;

registerBlockType( /* ... */, {
	// ...

	attributes: {
		url: {
			type: 'string',
		},
		text: {
			type: 'string',
		},
	},

	edit( { className, attributes, setAttributes } ) {
		return (
			<URLInputButton
				url={ attributes.url }
				onChange={ ( url, post ) => setAttributes( { url, text: post.title || 'Click here' } ) }
			/>
		);
	},

	save( { attributes } ) {
		return <a href={ attributes.url }>{ attributes.text }</a>;
	}
} );
```
{% end %}

# `URLInput`

Renders the URL input normally wrapped by `URLInputButton`.

## Properties

### `value: String`

*Required.* This should be set to the attribute (or component state) property used to store the URL.

### `onChange( url: String, post: Object ): Function`

*Required.* Called when the value changes. This is the same as the `onChange` prop described above for `URLInputButton`.

### `autoFocus: Boolean`

*Optional.* By default, the input will gain focus when it is rendered as typically it is used in combination with a `Popover` in `URLInputBUtton`. If you are rendering the component all the time set this to `false`.

## Example

{% codetabs %}
{% ES5 %}
```js
wp.blocks.registerBlockType( /* ... */, {
	// ...

	attributes: {
		url: {
			type: 'string'
		},
		text: {
			type: 'string'
		}
	},

	edit: function( props ) {
		return wp.element.createElement( wp.editor.URLInput, {
			className: props.className,
			value: props.attributes.url,
			onChange: function( url, post ) {
				props.setAttributes( { url: url, text: post.title || 'Click here' } );
			}
		} );
	},

	save: function( props ) {
		return wp.element.createElement( 'a', {
			href: props.attributes.url,
		}, props.attributes.text );
	}
} );
```
{% ESNext %}
```js
const { registerBlockType } = wp.blocks;
const { URLInput } = wp.editor;

registerBlockType( /* ... */, {
	// ...

	attributes: {
		url: {
			type: 'string',
		},
		text: {
			type: 'string',
		},
	},

	edit( { className, attributes, setAttributes } ) {
		return (
			<URLInput
				className={ className }
				value={ attributes.url }
				onChange={ ( url, post ) => setAttributes( { url, text: post.title || 'Click here' } ) }
			/>
		);
	},

	save( { attributes } ) {
		return <a href={ attributes.url }>{ attributes.text }</a>;
	}
} );
```
{% end %}
