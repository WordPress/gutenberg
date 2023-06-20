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

	/**
	 * Adds the action to the <form> element.
	 *
	 * - If no action is specified, the default is the REST API endpoint.
	 * - If the action is `/wp-comments-post.php`, the form is a comment form.
	 * - If the action is anything else, it is a custom form.
	 */
	$processed_content = new WP_HTML_Tag_Processor( $content );
	$processed_content->next_tag( 'form' );
	if ( empty( $attributes['action'] ) ) { // Default to the REST API endpoint.
		$processed_content->set_attribute( 'action', esc_attr( rest_url( 'wp/v2/block-form-submit' ) ) );
	} elseif ( '/wp-comments-post.php' === $attributes['action'] ) { // Comments.
		$processed_content->set_attribute( 'action', esc_url( site_url( '/wp-comments-post.php' ) ) );
	} else { // Custom.
		$processed_content->set_attribute( 'action', esc_attr( $attributes['action'] ) );
	}

	// Add the method attribute. If it is not set, default to `post`.
	$attributes['method'] = empty( $attributes['method'] ) ? 'post' : $attributes['method'];
	$processed_content->set_attribute( 'method', $attributes['method'] );

	$extra_fields = wp_nonce_field( 'wp-block-form', 'wp_rest', true, false );

	// If the form is a comment form, add the post ID.
	if ( '/wp-comments-post.php' === $attributes['action'] ) {
		$extra_fields .= '<input type="hidden" name="comment_post_ID" value="' . get_the_ID() . '" id="comment_post_ID">';
	}

	// Inject a hidden input with the nonce to strengthen security form-ID.
	return str_replace(
		'</form>',
		$extra_fields . '</form>',
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
