<?php
/**
 * Server-side rendering of the `core/back-to-top` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/back-to-top` block on the server.
 *
 * @param array $attributes Block attributes.
 * @return string Return the back to top link.
 */
function render_block_core_back_to_top( $attributes ) {
	$link_text          = isset( $attributes['text'] ) ? $attributes['text'] : __( 'Back to top' );
	$wrapper_attributes = get_block_wrapper_attributes();

	block_core_back_to_top_classic_fallback();

	return sprintf(
		'<p %1$s><a href="#wp-back-to-top">%2$s</a></p>',
		$wrapper_attributes,
		wp_kses_post( $link_text )
	);
}

/**
 * Registers the `core/back_to_top` block on the server.
 */
function register_block_core_back_to_top() {
	register_block_type_from_metadata(
		__DIR__ . '/back-to-top',
		array(
			'render_callback' => 'render_block_core_back_to_top',
		)
	);
}
add_action( 'init', 'register_block_core_back_to_top' );

/**
 * Block themes: If the block exists on the page, add the target id.
 * Classic themes: We can't check if the block is in use, so we always add the target id.
 */
function block_core_back_to_top_target() {
	echo '<div id="wp-back-to-top"></div>';
}
if ( wp_is_block_theme() ) {
	add_filter(
		'render_block',
		function( $html, $block ) {
			if ( 'core/back-to-top' === $block['blockName'] ) {
				add_action( 'wp_body_open', 'block_core_back_to_top_target' );
			}
			return $html;
		},
		10,
		2
	);
} else {
	add_action( 'wp_body_open', 'block_core_back_to_top_target' );
}

/**
 * Enqueue the fallback view.js file if the classic theme does not
 * use `wp_body_open()`.
 */
function block_core_back_to_top_classic_fallback() {
	if ( ! wp_is_block_theme() && 0 === did_action( 'wp_body_open' ) ) {
		// If the Gutenberg plugin is active, use the script from the plugin.
		if ( defined( 'IS_GUTENBERG_PLUGIN' ) && IS_GUTENBERG_PLUGIN ) {
			wp_enqueue_script(
				'wp-block-library-back-to-top-fallback',
				plugins_url( 'back-to-top/view.min.js', __FILE__ ),
				array(),
				filemtime( plugin_dir_path( __FILE__ ) . 'back-to-top/view.min.js' ),
				true
			);
		} else {
			wp_enqueue_script(
				'wp-block-library-back-to-top-fallback',
				includes_url( 'blocks/back-to-top/view.min.js', __DIR__ ),
				array(),
				'',
				true
			);
		}
	}
}
