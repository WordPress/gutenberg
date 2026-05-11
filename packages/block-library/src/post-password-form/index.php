<?php
/**
 * Server-side rendering of the `core/post-password-form` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-password-form` block on the server.
 *
 * @since 23.0.0
 * 
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the rendered password form, or an empty string if not applicable.
 */
function render_block_core_post_password_form( $attributes, $content, $block ) {
	error_log("render_block_core_post_password_form" . $block->context['postId']);
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	$post = get_post( $block->context['postId'] );
	error_log("post: " . print_r($post, true));

	if ( ! $post || ! post_password_required( $post ) ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes();

	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		get_the_password_form( $post )
	);
}

/**
 * Registers the `core/post-password-form` block on the server.
 *
 * @since 23.0.0
 */
function register_block_core_post_password_form() {
	register_block_type_from_metadata(
		__DIR__ . '/post-password-form',
		array(
			'render_callback' => 'render_block_core_post_password_form',
		)
	);
}

add_action( 'init', 'register_block_core_post_password_form' );
