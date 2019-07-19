<?php
/**
 * Server-side rendering of the `core/post-date` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-date` block on the server.
 *
 * @return string Returns the filtered post date for the current post wrapped inside "time" tags.
 */
function render_block_core_post_date( $attributes ) {
	$formats = array(
		'date' => 'd/m/Y',
		'datetime' => 'd/m/Y g:i',
	);
	rewind_posts();
	the_post();
	return '<time>' . get_the_date( $formats[ $attributes[ 'format' ] ] ) . '</time>';
}

/**
 * Registers the `core/post-date` block on the server.
 */
function register_block_core_post_date() {
	register_block_type(
		'core/post-date',
		array(
			'attributes'   => array(
				'format'   => array(
					'type' => 'string',
					'default' => 'date',
				),
			),
			'render_callback' => 'render_block_core_post_date',
		),
	);
}
add_action( 'init', 'register_block_core_post_date' );
