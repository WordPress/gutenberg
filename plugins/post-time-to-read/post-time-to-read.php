<?php
/**
 * Plugin Name:       Time to Read Block
 * Description:       Example block scaffolded with Create Block tool.
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           0.1.0
 * Author:            The WordPress Contributors
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       post-time-to-read
 *
 */

/**
 * Renders the `gutenberg/time-to-read-read` block on the server.
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

	$content = get_the_content();

	/*
	 * Average reading rate - based on average taken from
	 * https://irisreading.com/average-reading-speed-in-various-languages/
	 * (Characters/minute used for Chinese rather than words).
	 */
	$average_reading_rate = 189;

	$word_count_type = wp_get_word_count_type();

	$minutes_to_read = max( 1, (int) round( wp_word_count( $content, $word_count_type ) / $average_reading_rate ) );

	$minutes_to_read_string = sprintf(
		/* translators: %s is the number of minutes the post will take to read. */
		_n( '%s minute', '%s minutes', $minutes_to_read ),
		$minutes_to_read
	);

	$align_class_name = empty( $attributes['textAlign'] ) ? '' : "has-text-align-{$attributes['textAlign']}";

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $align_class_name ) );

	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		$minutes_to_read_string
	);
}

/**
 * Registers the `gutenberg/time-to-read-read` block on the server.
 */
function register_block_core_post_time_to_read() {
	register_block_type(
		__DIR__ . '/build'
	);
}

add_action( 'init', 'register_block_core_post_time_to_read' );
