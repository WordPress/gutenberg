<?php
/**
 * Adds the wp-block-list-item class to the rendered list item block.
 * @package WordPress
 */

/**
 * Adds a wp-block-list-item class to the list item block.
 * For example, <li> would be transformed to <li class="wp-block-list-item">.
 * 
 * @see https://github.com/WordPress/gutenberg/issues/12420
 *
 * @param array  $attributes Attributes of the block being rendered.
 * @param string $content Content of the block being rendered.
 *
 * @return string The content of the block being rendered.
 */
function block_core_list_item_render( $attributes, $content ) {
	if ( ! $content ) {
		return $content;
	}

	$processor = new WP_HTML_Tag_Processor( $content );

	while ( $processor->next_tag() ) {
		if ( 'LI' === $processor->get_tag() ) {
			$processor->add_class( 'wp-block-list-item' );
			break;
		}
	}

	return $processor->get_updated_html();
}

/**
 * Registers the `core/list-item` block on server.
 */
function register_block_core_list_item() {
	register_block_type_from_metadata(
		__DIR__ . '/list-item',
		array(
			'render_callback' => 'block_core_list_item_render',
		)
	);
}

add_action( 'init', 'register_block_core_list_item' );
