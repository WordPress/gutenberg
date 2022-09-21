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
	$action = apply_filters( 'block_form', $action, $attributes, $content, $block );

	// Build the form method attribute.
	$method = empty( $attributes['method'] ) ? '' : $attributes['method'];
	$method = empty( $method ) || ( 'get' !== strtolower( $method ) && 'post' !== strtolower( $method ) ) ? 'get' : $method;
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

	return str_replace(
		'<form ',
		sprintf(
			'<form action="%1$s" method="%2$s" ',
			esc_attr( $action ),
			esc_attr( $method )
		),
		$content
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
