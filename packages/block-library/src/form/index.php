<?php
/**
 * Server-side rendering of the `core/form` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/form` block on server.
 *
 * @param array    $attributes The block attributes.
 * @param string   $content The saved content.
 * @param WP_Block $block The parsed block.
 *
 * @return string The content of the block being rendered.
 */
function render_block_core_form( $attributes, $content, $block ) {

	// Build the form action attribute.
	$action = empty( $attributes['action'] ) ? '' : $attributes['action'];
	$action = empty( $action ) ? '#' : $action;

	/**
	 * Filters the form action attribute.
	 *
	 * @param string $action The form action attribute.
	 * @param array  $attributes The block attributes.
	 * @param string $content The saved content.
	 * @param WP_Block $block The parsed block.
	 *
	 * @return string The form action attribute.
	 */
	$action = apply_filters( 'block_form_action', $action, $attributes, $content, $block );

	// Build the form method attribute.
	$method = empty( $attributes['method'] ) ? '' : $attributes['method'];
	$method = empty( $method ) || ( 'get' !== strtolower( $method ) && 'post' !== strtolower( $method ) ) ? 'post' : $method;
	/**
	 * Filters the form method attribute.
	 *
	 * @param string $method The form method attribute.
	 * @param array  $attributes The block attributes.
	 * @param string $content The saved content.
	 * @param WP_Block $block The parsed block.
	 *
	 * @return string The form method attribute.
	 */
	$method = apply_filters( 'block_form_method', $method, $attributes, $content, $block );

	$form_id = empty( $attributes['formId'] ) ? md5( json_encode( array( $attributes, $block ) ) ) : $attributes['formId'];

	// Add the form action & method.
	$processed_content = new WP_HTML_Tag_Processor( $content );
	$processed_content->next_tag( 'form' );
	$processed_content->set_attribute( 'action', esc_attr( $action ) );
	$processed_content->set_attribute( 'method', esc_attr( $method ) );

	$nonce_field = wp_nonce_field( 'wp-block-form', '_wpnonce', true, false );

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

/**
 * Handles the form submission.
 *
 * This is the default action, which sends an email to the admin.
 * To override the default action, first remove the default action:
 * remove_action( 'wp', 'submit_core_form_block' );
 * Then add your own action by creating a function and hooking it to the 'wp' action.
 */
function submit_core_form_block() {

	$has_valid_nonce = wp_verify_nonce( $_POST['_wpnonce'], 'wp-block-form' );
	if ( ! $has_valid_nonce ) {
		return;
	}

	$referer = wp_get_referer();
	$content = sprintf(
		/* translators: %s: The request URI. */
		__( 'Form submission from %1$s', 'gutenberg' ) . '</br>',
		'<a href="' . esc_url( $referer ) . '">' . esc_url( $referer ) . '</a>'
	);

	$skip_fields = array( '_wpnonce', '_wp_http_referer' );
	foreach ( $_POST as $key => $value ) {
		if ( in_array( $key, $skip_fields, true ) ) {
			continue;
		}
		$content .= $key . ': ' . $value . '</br>';
	}

	wp_mail( get_option( 'admin_email' ), __( 'Form submission', 'gutenberg' ), $content );
}
add_action( 'wp', 'submit_core_form_block' );
