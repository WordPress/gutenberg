# `URLInputButton`

Render a URL input button that pops up an input to search for and select a post or enter any arbitrary URL.

## Properties

### `url: String`

_Required._ This should be set to the attribute (or component state) property used to store the URL.

### `onChange( url: String, ?post: Object ): Function`

_Required._ Called when the value changes. The second parameter is `null` unless the user selects a post from the suggestions dropdown. In those cases the `post` parameter will look like this:

```json
{
	"id": 1,
	"subtype": "page",
	"title": "Sample Page",
	"type": "post",
	"url": "https://example.com/sample-page/",
	"_links": {
		"self": [
			{
				"embeddable": true,
				"href": "https://example.com/wp-json/wp/v2/pages/1"
			}
		],
		"about": [ { "href": "https://example.com/wp-json/wp/v2/types/page" } ],
		"collection": [ { "href": "https://example.com/wp-json/wp/v2/search" } ]
	}
}
```

This prop is passed directly to the `URLInput` component.

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
		return wp.element.createElement( wp.blockEditor.URLInputButton, {
			className: props.className,
			url: props.attributes.url,
			onChange: function( url, post ) {
				props.setAttributes( { url: url, text: (post && post.title) || 'Click here' } );
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
import { registerBlockType } from '@wordpress/blocks';
import { URLInputButton } from '@wordpress/block-editor';

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
				onChange={ ( url, post ) => setAttributes( { url, text: (post && post.title) || 'Click here' } ) }
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

Renders the URL input field used by the `URLInputButton` component. It can be used directly to display the input field in different ways such as in a `Popover` or inline.

## Properties

### `value: String`

_Required._ This should be set to the attribute (or component state) property used to store the URL.

### `onChange( url: String, ?post: Object ): Function`

_Required._ Called when the value changes. The second parameter is `null` unless the user selects a post from the suggestions dropdown. In those cases the `post` parameter will look like this:

```json
{
	"id": 1,
	"subtype": "page",
	"title": "Sample Page",
	"type": "post",
	"url": "https://example.com/sample-page/",
	"_links": {
		"self": [
			{
				"embeddable": true,
				"href": "https://example.com/wp-json/wp/v2/pages/1"
			}
		],
		"about": [ { "href": "https://example.com/wp-json/wp/v2/types/page" } ],
		"collection": [ { "href": "https://example.com/wp-json/wp/v2/search" } ]
	}
}
```

### `label: String`

_Optional._ If this property is added, a label will be generated using label property as the content.

### `className: String`

_Optional._ Adds and optional class to the parent `div` that wraps the URLInput field and popover

### `placeholder: String`

_Optional._ Placeholder text to show when the field is empty, similar to the
[`input` and `textarea` attribute of the same name](https://developer.mozilla.org/en-US/docs/Learn/HTML/Forms/HTML5_updates#The_placeholder_attribute).

### `disableSuggestions: Boolean`

_Optional._ Provides additional control over whether suggestions are disabled.

When hiding the URLInput using CSS (as is sometimes done for accessibility purposes), the suggestions can still be displayed. This is because they're rendered in a popover in a different part of the DOM, so any styles applied to the URLInput's container won't affect the popover.

This prop allows the suggestions list to be programmatically not rendered by passing a boolean—it can be `true` to make sure suggestions aren't rendered, or `false`/`undefined` to fall back to the default behaviour of showing suggestions when matching autocompletion items are found.

### `__nextHasNoMarginBottom: Boolean`

Start opting into the new margin-free styles that will become the default in a future version, currently scheduled to be WordPress 6.4. (The prop can be safely removed once this happens.)

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
		return wp.element.createElement( wp.blockEditor.URLInput, {
			className: props.className,
			value: props.attributes.url,
			onChange: function( url, post ) {
				props.setAttributes( { url: url, text: (post && post.title) || 'Click here' } );
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
import { registerBlockType } from '@wordpress/blocks';
import { URLInput } from '@wordpress/block-editor';

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
				__nextHasNoMarginBottom
				className={ className }
				value={ attributes.url }
				onChange={ ( url, post ) => setAttributes( { url, text: (post && post.title) || 'Click here' } ) }
			/>
		);
	},

	save( { attributes } ) {
		return <a href={ attributes.url }>{ attributes.text }</a>;
	}
} );
```

{% end %}
