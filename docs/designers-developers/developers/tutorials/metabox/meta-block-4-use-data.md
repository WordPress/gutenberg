# Use Post Meta Data

You can use the post meta data stored in the last step in multiple ways.

## Use Post Meta in PHP

The first example uses the value from the post meta field and appends it to the end of the post content wrapped in a H4 tag. This method in PHP is unchanged in WordPress 5.0.

```php
function myguten_content_filter( $content ) {
	$value = get_post_meta( get_the_ID(), 'myguten_field', true );
	return sprintf( "%s <h4> %s </h4>", $content, esc_html( $value ) );
}
add_filter( 'the_content', 'myguten_content_filter' );
```

## Use Post Meta in Block

You can also use the post meta data in other blocks. For this example the data is loaded at the end of every paragraph block when it is rendered, ie. shown to the user. You can replace this for any core or custom block types as needed.

```php
function myguten_render_paragraph( $attributes, $content ) {
	$value = get_post_meta( get_the_ID(), 'myguten_field', true );
	return sprintf( "%s (%s)", $content, esc_html( $value ) );
}

register_block_type( 'core/paragraph', array(
	'render_callback' => 'myguten_render_paragraph',
) );
```

