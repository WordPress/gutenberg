<?php
/**
 * Server-side rendering of the `core/template-content` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/template-content` block on the server.
 *
 * Resolves the template id stashed by the root-template swap and renders its
 * content via `do_blocks()`. Guards against re-entrant rendering of the same
 * template id.
 *
 * @since 7.1.0
 *
 * @return string Rendered template content.
 */
function render_block_core_template_content() {
	static $seen_ids = array();

	$inner_template_id = $GLOBALS['_wp_current_inner_template_id'] ?? null;
	if ( ! $inner_template_id ) {
		return '';
	}

	if ( isset( $seen_ids[ $inner_template_id ] ) ) {
		return ( WP_DEBUG && WP_DEBUG_DISPLAY )
			? __( '[block rendering halted]' )
			: '';
	}

	$template = get_block_template( $inner_template_id, 'wp_template' );
	if ( ! $template || empty( $template->content ) ) {
		return '';
	}

	$seen_ids[ $inner_template_id ] = true;
	$content                        = do_blocks( $template->content );
	unset( $seen_ids[ $inner_template_id ] );

	$wrapper_attributes = get_block_wrapper_attributes();
	return "<div $wrapper_attributes>" . str_replace( ']]>', ']]&gt;', $content ) . '</div>';
}

/**
 * Registers the `core/template-content` block on the server.
 *
 * @since 7.1.0
 */
function register_block_core_template_content() {
	register_block_type_from_metadata(
		__DIR__ . '/template-content',
		array(
			'render_callback' => 'render_block_core_template_content',
		)
	);
}
add_action( 'init', 'register_block_core_template_content' );
