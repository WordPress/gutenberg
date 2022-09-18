<?php
/**
 * Server-side rendering of the `core/post-time-to-read` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-time-to-read` block on the server.
 *
 * @param  array    $attributes Block attributes.
 * @param  string   $content    Block default content.
 * @param  WP_Block $block      Block instance.
 * @return string Returns the rendered post author name block.
 */
function render_block_core_post_time_to_read( $attributes, $content, $block ) {
	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	$minutes_to_read = ! empty( $attributes['minutesToRead'] ) ? (int) $attributes['minutesToRead'] : 0;

	$minutes_to_read_string = $minutes_to_read !== 0
		? sprintf(
				/* translators: %d is the number of minutes the post will take to read. */
				_n(
					'You can read this post in %d minute.',
					'You can read this post in %d minutes.',
					$minutes_to_read
				),
				$minutes_to_read
		  )
		: __( 'You can read this post less than a minute.' );

	$align_class_name = empty( $attributes['textAlign'] ) ? '' : "has-text-align-{$attributes['textAlign']}";

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $align_class_name ) );

	return sprintf(
		'<p %1$s>%2$s</p>',
		$wrapper_attributes,
		$minutes_to_read_string
	);
}

/**
 * Registers the `core/post-time-to-read` block on the server.
 */
function register_block_core_post_time_to_read() {
	register_block_type_from_metadata(
		__DIR__ . '/post-time-to-read',
		array(
			'render_callback' => 'render_block_core_post_time_to_read',
		)
	);
}
add_action( 'init', 'register_block_core_post_time_to_read' );
