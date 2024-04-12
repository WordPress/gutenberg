<?php
/**
 * Server-side rendering of the `core/home-link` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/home-link` block.
 *
 * @since 6.0.0
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The saved content.
 * @param WP_Block $block      The parsed block.
 *
 * @return string Returns the post content with the home url added.
 */
function render_block_core_home_link( $attributes, $content, $block ) {
	if ( empty( $attributes['label'] ) ) {
		// Using a fallback for the label attribute allows rendering the block even if no attributes have been set,
		// e.g. when using the block as a hooked block.
		// Note that the fallback value needs to be kept in sync with the one set in `edit.js` (upon first loading the block in the editor).
		$attributes['label'] = __( 'Home' );
	}
	$aria_current = '';

	if ( is_front_page() ) {
		$aria_current = ' aria-current="page"';
	} elseif ( is_home() && ( (int) get_option( 'page_for_posts' ) !== get_queried_object_id() ) ) {
		// Edge case where the Reading settings has a posts page set but not a static homepage.
		$aria_current = ' aria-current="page"';
	}

	return sprintf(
		'<a %1$s href="%2$s" rel="home"%3$s>%4$s</a>',
		get_block_wrapper_attributes(),
		esc_url( home_url() ),
		$aria_current,
		wp_kses_post( $attributes['label'] )
	);
}

/**
 * Register the home block
 *
 * @since 6.0.0
 *
 * @uses render_block_core_home_link()
 * @throws WP_Error An WP_Error exception parsing the block definition.
 */
function register_block_core_home_link() {
	register_block_type_from_metadata(
		__DIR__ . '/home-link',
		array(
			'render_callback' => 'render_block_core_home_link',
		)
	);
}
add_action( 'init', 'register_block_core_home_link' );
