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
function render_block_core_post_time_to_read($attributes, $content, $block)
{
	if (! isset($block->context['postId'])) {
		return '';
	}

	$content = get_the_content();

	/*
	 * Reading rates (words per minute) - based on averages from
	 * https://irisreading.com/average-reading-speed-in-various-languages/
	 * (Characters/minute used for Chinese rather than words).
	 */
	$average_reading_rate = 189;
	$min_reading_rate     = 138;
	$max_reading_rate     = 228;

	$word_count_type = wp_get_word_count_type();

	$total_words = wp_word_count($content, $word_count_type);

	if (! empty($attributes['displayAsRange'])) {
		$min_minutes = max(1, (int) round($total_words / $max_reading_rate));
		$max_minutes = max(1, (int) round($total_words / $min_reading_rate));
		if ($min_minutes === $max_minutes) {
			$max_minutes = $min_minutes + 1;
		}
		/* translators: 1: minimum minutes, 2: maximum minutes to read the post. */
		$minutes_to_read_string = sprintf(_x('%1$s–%2$s minutes', 'Range of minutes to read'), $min_minutes, $max_minutes);
	} else {
		$minutes_to_read = max(1, (int) round($total_words / $average_reading_rate));
		$minutes_to_read_string = sprintf(
			/* translators: %s: the number of minutes to read the post. */
			_n('%s minute', '%s minutes', $minutes_to_read),
			$minutes_to_read
		);
	}

	$align_class_name = empty($attributes['textAlign']) ? '' : "has-text-align-{$attributes['textAlign']}";

	$wrapper_attributes = get_block_wrapper_attributes(array('class' => $align_class_name));

	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		$minutes_to_read_string
	);
}

/**
 * Registers the `core/post-time-to-read` block on the server.
 */
function register_block_core_post_time_to_read()
{
	register_block_type_from_metadata(
		__DIR__ . '/post-time-to-read',
		array(
			'render_callback' => 'render_block_core_post_time_to_read',
		)
	);
}
add_action('init', 'register_block_core_post_time_to_read');
