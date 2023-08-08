<?php
/**
 * Server-side rendering of the `core/form-submission-notification` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/form-submission-notification` block on server.
 *
 * @param array  $attributes The block attributes.
 * @param string $content The saved content.
 *
 * @return string The content of the block being rendered.
 */
function render_block_core_form_submission_notification( $attributes, $content ) {
	$show = apply_filters( 'show_form_submission_notification_block', false, $attributes, $content );
	if ( ! $show ) {
		return '';
	}
	return $content;
}

/**
 * Registers the `core/form-submission-notification` block on server.
 */
function register_block_core_form_submission_notification() {
	register_block_type_from_metadata(
		__DIR__ . '/form-submission-notification',
		array(
			'render_callback' => 'render_block_core_form_submission_notification',
		)
	);
}
add_action( 'init', 'register_block_core_form_submission_notification' );
