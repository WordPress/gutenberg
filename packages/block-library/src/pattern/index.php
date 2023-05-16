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
	if ( empty( $attributes['slug'] ) ) {
		return '';
	}

	$slug     = $attributes['slug'];
	$registry = WP_Block_Patterns_Registry::get_instance();

	if ( ! $registry->is_registered( $slug ) ) {
		return '';
	}

	$pattern = $registry->get_registered( $slug );

	// Currently all existing blocks should be returned here without a wp-block-pattern wrapper
	// as the syncStatus attribute is only used if the gutenberg-pattern-enhancements experiment
	// is enabled.
	if ( ! isset( $attributes['syncStatus'] ) ) {
		return do_blocks( $pattern['content'] );
	}

	$block_classnames = 'wp-block-pattern ' . str_replace( '/', '-', $attributes['slug'] );
	$classnames       = isset( $attributes['className'] ) ? $attributes['className'] . ' ' . $block_classnames : $block_classnames;
	$wrapper          = '<div class="' . esc_attr( $classnames ) . '">%s</div>';

	return sprintf( $wrapper, do_blocks( $pattern['content'] ) );
}

add_action( 'init', 'register_block_core_pattern' );
