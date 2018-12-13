
### Register Meta Field

You need to register the meta field that is going to store the data. When you register the field, you need to be sure to pass `show_in_rest` parameter, as the Block Editor uses the REST API to load and save meta data, this feature ensures that the data will be included. See the [register_meta](https://developer.wordpress.org/reference/functions/register_meta/) function definition for more details.

Add the following PHP code to the `myguten-meta-block.php` file:

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
