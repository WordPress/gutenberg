<?php
/**
 * Server-side rendering of the `core/list` block.
 *
 * @package WordPress
 */

/**
 * Adds a wp-block-list class to the list block content.
 *
 * For example, the following block content:
 * <ol>
 *    <li>Test</li>
 * </ol>
 *
 * Would be transformed to:
 * <ol class="wp-block-list">
 *    <li>Test</li>
 * </ol>
 *
 * @param array  $attributes Attributes of the block being rendered.
 * @param string $content Content of the block being rendered.
 *
 * @return string The content of the block being rendered.
 */
function block_core_list_render( $attributes, $content ) {
	if ( ! $content ) {
		return $content;
	}

	$list = new WP_HTML_Tag_Processor( $content );

	while ( $list->next_tag() ) {
		$tag = $list->get_tag();
		if ( 'UL' === $tag || 'OL' === $tag ) {
			$list->add_class( 'wp-block-list' );
			break;
		}
	}

	return $list->get_updated_html();
}

/**
 * Registers the `core/list` block on server.
 */
function register_block_core_list() {
	register_block_type_from_metadata(
		__DIR__ . '/list',
		array(
			'render_callback' => 'block_core_list_render',
		)
	);
}

add_action( 'init', 'register_block_core_list' );
