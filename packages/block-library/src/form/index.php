<?php
/**
 * Server-side rendering of the `core/form` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/form` block on server.
 *
 * @param array  $attributes The block attributes.
 * @param string $content The saved content.
 *
 * @return string The content of the block being rendered.
 */
function render_block_core_form( $attributes, $content ) {

	// Add the form action & method.
	$processed_content = new WP_HTML_Tag_Processor( $content );
	$processed_content->next_tag( 'form' );
	$processed_content->set_attribute( 'action', esc_attr( rest_url( 'wp/v2/block-form-submit' ) ) );
	$processed_content->set_attribute( 'method', 'post' );

	$nonce_field = wp_nonce_field( 'wp-block-form', 'wp_rest', true, false );

	// Inject a hidden input with the nonce to strengthen security form-ID.
	return str_replace(
		'</form>',
		$nonce_field . '</form>',
		$processed_content->get_updated_html()
	);
}

/**
 * Registers the `core/form` block on server.
 */
function register_block_core_form() {
	register_block_type_from_metadata(
		__DIR__ . '/form',
		array(
			'render_callback' => 'render_block_core_form',
		)
	);
}
add_action( 'init', 'register_block_core_form' );
