<?php
/**
 * Server-side rendering of the `core/navigation-link` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/navigation-link` block.
 *
 * @param array $attributes The block attributes.
 * @param array $content The saved content.
 *
 * @return string Returns the post content with the legacy widget added.
 */
function render_block_core_navigation_link( $attributes, $content ) {
	if ( get_the_ID() === $attributes['id'] ) {
		return str_replace(
			'<li class="wp-block-navigation-link',
			'<li class="wp-block-navigation-link current-menu-item',
			$content
		);
	}

	return $content;
}

/**
 * Register the navigation link block.
 *
 * @uses render_block_core_navigation()
 * @throws WP_Error An WP_Error exception parsing the block definition.
 */
function register_block_core_navigation_link() {
	register_block_type_from_metadata(
		__DIR__ . '/navigation-link',
		array(
			'render_callback' => 'render_block_core_navigation_link',
		)
	);
}
add_action( 'init', 'register_block_core_navigation_link' );
