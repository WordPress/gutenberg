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
 * @since 6.3.0 Backwards compatibility: blocks with no `syncStatus` attribute do not receive block wrapper.
 *
 * @param array $attributes Block attributes.
 *
 * @return string Returns the output of the pattern.
 */
function render_block_core_pattern( $attributes ) {
	if ( empty( $attributes['slug'] ) ) {
		return '';
	}

	$slug     = $attributes['slug'];
	$registry = WP_Block_Patterns_Registry::get_instance();

	if ( ! $registry->is_registered( $slug ) ) {
		return '';
	}

	$pattern = $registry->get_registered( $slug );
	$content = $pattern['content'];

	$gutenberg_experiments = get_option( 'gutenberg-experiments' );
	if ( $gutenberg_experiments && ! empty( $gutenberg_experiments['gutenberg-auto-inserting-blocks'] ) ) {
		// TODO: In the long run, we'd likely want to have a filter in the `WP_Block_Patterns_Registry` class
		// instead to allow us plugging in code like this.
		$blocks  = parse_blocks( $content );
		$content = gutenberg_serialize_blocks( $blocks );
	}

	return do_blocks( $content );
}

add_action( 'init', 'register_block_core_pattern' );
