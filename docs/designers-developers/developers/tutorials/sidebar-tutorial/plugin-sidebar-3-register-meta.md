# Register the meta field

To work with fields in the `post_meta` table, WordPress has a function called [register_meta](https://developer.wordpress.org/reference/functions/register_meta/). You're going to use it to register a new field called `sidebar_plugin_meta_block_field`, which will be a single string. Note that this field needs to be available through the [REST API](https://developer.wordpress.org/rest-api/) because that's how the block editor access data.

Add this to the PHP code, within the `init` callback function:

```php
register_meta( 'post', 'sidebar_plugin_meta_block_field', array(
	'show_in_rest' => true,
	'single' => true,
	'type' => 'string',
) );
```

To make sure the field has been loaded, query the block editor [internal data structures](/docs/designers-developers/developers/data/), also known as _stores_. Open your browser's console, and execute this piece of code:

```js
wp.data.select( 'core/editor' ).getCurrentPost().meta;
```

Before adding the `register_meta` function to the plugin, this code returns a void array, because WordPress hasn't been told to load any meta field yet. After registering the field, the same code will return an object containing the registered meta field you registered.
