<?php
/**
 * Server-side rendering of the `core/pattern` block.
 *
 * @package WordPress
 */

/**
 *  Registers the `core/pattern` block on the server.
 *
 * @return void
 */
function register_block_core_pattern() {
	register_block_type_from_metadata(
		__DIR__ . '/pattern',
		array(
			'render_callback' => 'render_block_core_pattern',
		)
	);
}

/**
 * Renders the `core/pattern` block on the server.
 *
 * @param array $attributes Block attributes.
 *
 * @return string Returns the output of the pattern.
 */
function render_block_core_pattern( $attributes ) {
	$slug = $attributes['slug'];
	if ( class_exists( 'WP_Block_Patterns_Registry' ) && WP_Block_Patterns_Registry::get_instance()->is_registered( $slug ) ) {
		$pattern = WP_Block_Patterns_Registry::get_instance()->get_registered( $slug );
		return do_blocks( '<!-- wp:group --><div class="wp-block-group">' . $pattern['content'] . '</div><!-- /wp:group -->' );
	}
}

add_action( 'init', 'register_block_core_pattern' );
