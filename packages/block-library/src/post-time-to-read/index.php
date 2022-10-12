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
	$content = get_the_content();

	if ( ! isset( $block->context['postId'] ) || ! $content ) {
		return '';
	}

	/*
	 * Average reading rate - based on average taken from
	 * https://irisreading.com/average-reading-speed-in-various-languages/
	 * (Characters/minute used for Chinese rather than words).
	 */
	$average_reading_rate = 189;

	/*
	 * translators: If your word count is based on single characters (e.g. East Asian characters),
	 * enter 'characters_excluding_spaces' or 'characters_including_spaces'. Otherwise, enter 'words'.
	 * Do not translate into your own language.
	 */
	$word_count_type = _x( 'words', 'Word count type. Do not translate!' );

	$minutes_to_read = (int) round( gutenberg_word_count( $content, $word_count_type ) / $average_reading_rate );

	$minutes_to_read_string = __( 'You can read this post in less than a minute.' );

	if ( 0 !== $minutes_to_read ) {
		$minutes_to_read_string = sprintf(
			/* translators: %d is the number of minutes the post will take to read. */
			_n(
				'You can read this post in %d minute.',
				'You can read this post in %d minutes.',
				$minutes_to_read
			),
			$minutes_to_read
		);
	}

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
