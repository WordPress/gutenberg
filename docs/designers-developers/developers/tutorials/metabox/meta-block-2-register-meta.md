# Register Meta Field

A post meta field is a WordPress object used to store extra data about a post. You need to first register a new meta field prior to use.

When registering the field, note the `show_in_rest` parameter, this ensures the data will be included in the REST API, which the Block Editor uses to load and save meta data. See the [register_meta](https://developer.wordpress.org/reference/functions/register_meta/) function definition for extra information.

To register the field, add the following PHP code to your plugin file:

```php
// register custom meta tag field
function myguten_register_meta() {
	register_meta( 'post', 'myguten_meta_block_field', array(
		'show_in_rest' => true,
		'single' => true,
		'type' => 'string',
	) );
}
add_action( 'init', 'myguten_register_meta' );
```

**NOTE:** If the meta key name starts with an underscore WordPress considers it a protected field, this requires setting an `auth_callback` function for checking permissions.  Here is an example:

```php
register_meta( 'post', '_myguten_protected_key', array(
	'show_in_rest' => true,
	'single' => true,
	'type' => 'string',
	'auth_callback' => function() {
		return current_user_can( 'edit_posts' );
	}
) );
```
