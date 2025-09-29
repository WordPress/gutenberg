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

	$content              = get_the_content();
	$average_reading_rate = isset( $attributes['averageReadingSpeed'] ) ? $attributes['averageReadingSpeed'] : 189;

	$display_mode = isset( $attributes['displayMode'] ) ? $attributes['displayMode'] : 'time';

	$word_count_type = wp_get_word_count_type();
	$total_words     = wp_word_count( $content, $word_count_type );

	$parts = array();

	// Add "time to read" part, if enabled.
	if ( 'time' === $display_mode ) {
		if ( ! empty( $attributes['displayAsRange'] ) ) {
			// Calculate faster reading rate with 20% speed = lower minutes,
			// and slower reading rate with 20% speed = higher minutes.
			$min_minutes = max( 1, (int) round( $total_words / $average_reading_rate * 0.8 ) );
			$max_minutes = max( 1, (int) round( $total_words / $average_reading_rate * 1.2 ) );
			if ( $min_minutes === $max_minutes ) {
				$max_minutes = $min_minutes + 1;
			}
			/* translators: 1: minimum minutes, 2: maximum minutes to read the post. */
			$time_string = sprintf(
				/* translators: 1: minimum minutes, 2: maximum minutes to read the post. */
				_x( '%1$s–%2$s minutes', 'Range of minutes to read' ),
				$min_minutes,
				$max_minutes
			);
		} else {
			$minutes_to_read = max( 1, (int) round( $total_words / $average_reading_rate ) );
			$time_string     = sprintf(
				/* translators: %s: the number of minutes to read the post. */
				_n( '%s minute', '%s minutes', $minutes_to_read ),
				$minutes_to_read
			);
		}
		$parts[] = $time_string;
	}

	// Add "word count" part, if enabled.
	if ( 'words' === $display_mode ) {
		$word_count_string = 'words' === $word_count_type ? sprintf(
			/* translators: %s: the number of words in the post. */
			_n( '%s word', '%s words', $total_words ),
			number_format_i18n( $total_words )
		) : sprintf(
			/* translators: %s: the number of characters in the post. */
			_n( '%s character', '%s characters', $total_words ),
			number_format_i18n( $total_words )
		);
		$parts[] = $word_count_string;
	}

	$display_string = implode( '<br>', $parts );

	$align_class_name = empty( $attributes['textAlign'] ) ? '' : "has-text-align-{$attributes['textAlign']}";

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $align_class_name ) );

	return sprintf(
		'<div %1$s>%2$s</div>',
		$wrapper_attributes,
		$display_string
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
