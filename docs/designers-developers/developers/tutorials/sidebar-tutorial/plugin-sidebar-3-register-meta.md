# Register the meta field

To work with fields in the _post_meta_ table, WordPress has a function called [register_meta](https://developer.wordpress.org/reference/functions/register_meta/). We're going to use it to register a new field called `sidebar_plugin_meta_block_field`. We configure this field to be available through the [REST API](https://developer.wordpress.org/rest-api/) because that's how the block editor access data, to be a single field (meaning that it contains a value, not an array of values), and to be of type _string_. We need to add this to our PHP code, within the _init_ callback function.

```php
register_meta( 'post', 'sidebar_plugin_meta_block_field', array(
	'show_in_rest' => true,
	'single' => true,
	'type' => 'string',
) );
```

To make sure the field has been loaded, we can query the block editor [data structures](https://wordpress.org/gutenberg/handbook/designers-developers/developers/data/). Open your browser's console, and execute:

```js
wp.data.select( 'core/editor' ).getCurrentPost().meta;
```

Before adding the `register_meta` function to our plugin, this returns a void array, because we haven't told WordPress to load any meta field yet. After registering the field, the same code will return an object containing the registered meta field and their values. In our case, it will contain `sidebar_plugin_meta_block_field`.
