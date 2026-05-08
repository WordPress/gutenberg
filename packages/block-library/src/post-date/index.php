<?php
/**
 * Server-side rendering of the `core/post-date` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-date` block on the server.
 *
 * @since 5.8.0
 * @since 6.9.0 Added `datetime` attribute and Block Bindings support.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the filtered post date for the current post wrapped inside "time" tags.
 */
function render_block_core_post_date( $attributes, $content, $block ) {
	$classes = array();

	if (
		! isset( $attributes['datetime'] ) && ! (
			isset( $attributes['metadata']['bindings']['datetime']['source'] ) &&
			isset( $attributes['metadata']['bindings']['datetime']['args'] )
		)
	) {
		/*
		 * This is the legacy version of the block that didn't have the `datetime` attribute.
		 * This branch needs to be kept for backward compatibility.
		 */
		$source = get_block_bindings_source( 'core/post-data' );
		if ( isset( $attributes['displayType'] ) && 'modified' === $attributes['displayType'] ) {
			$source_args = array(
				'field' => 'modified',
			);
		} else {
			$source_args = array(
				'field' => 'date',
			);
		}
		$attributes['datetime'] = $source->get_value( $source_args, $block, 'datetime' );
	}

	if ( isset( $source_args['field'] ) && 'modified' === $source_args['field'] ) {
		$classes[] = 'wp-block-post-date__modified-date';
	}

	if ( empty( $attributes['datetime'] ) ) {
		// If the `datetime` attribute is empty, it could be because Block Bindings
		// set it that way when the modified date is before the publish date.
		// (See https://github.com/WordPress/gutenberg/pull/46839 where this logic was originally
		// implemented.)
		//
		// However, when a post is first published, WordPress sets post_modified equal to
		// post_date. In that case we still want to render the modified date.
		// Detect this scenario and fall back to the actual modified date.
		// See https://github.com/WordPress/gutenberg/issues/57915.
		$post_id = $block->context['postId'] ?? null;

		// Determine whether this block is displaying the modified date — either via
		// the legacy displayType attribute or via a Block Bindings binding.
		$binding_args  = $attributes['metadata']['bindings']['datetime']['args'] ?? array();
		$binding_field = $binding_args['field'] ?? $binding_args['key'] ?? null;
		$is_modified   = ( isset( $source_args['field'] ) && 'modified' === $source_args['field'] )
			|| 'modified' === $binding_field;

		if ( $post_id && $is_modified
			&& get_the_modified_date( 'U', $post_id ) >= get_the_date( 'U', $post_id ) ) {
			// Modified date is equal to or later than publish date — render it.
			$attributes['datetime'] = esc_attr( get_the_modified_date( 'c', $post_id ) );
		} else {
			// Modified date is strictly before the publish date; respect the empty value.
			return '';
		}
	}

	$unformatted_date = $attributes['datetime'];
	$post_timestamp   = strtotime( $unformatted_date );

	if ( isset( $attributes['format'] ) && 'human-diff' === $attributes['format'] ) {
		if ( $post_timestamp > time() ) {
			// translators: %s: human-readable time difference.
			$formatted_date = sprintf( __( '%s from now' ), human_time_diff( $post_timestamp ) );
		} else {
			// translators: %s: human-readable time difference.
			$formatted_date = sprintf( __( '%s ago' ), human_time_diff( $post_timestamp ) );
		}
	} else {
		$format         = empty( $attributes['format'] ) ? get_option( 'date_format' ) : $attributes['format'];
		$formatted_date = wp_date( $format, $post_timestamp );
	}

	if ( isset( $attributes['textAlign'] ) ) {
		$classes[] = 'has-text-align-' . $attributes['textAlign'];
	}
	if ( isset( $attributes['style']['elements']['link']['color']['text'] ) ) {
		$classes[] = 'has-link-color';
	}

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => implode( ' ', $classes ) ) );

	$time_tag = sprintf( '<time datetime="%1$s">%2$s</time>', $unformatted_date, $formatted_date );

	if ( isset( $attributes['isLink'] ) && $attributes['isLink'] && isset( $block->context['postId'] ) ) {
		$time_tag = sprintf( '<a href="%1s">%2s</a>', get_the_permalink( $block->context['postId'] ), $time_tag );
	}

	return sprintf( '<div %1$s>%2$s</div>', $wrapper_attributes, $time_tag );
}

/**
 * Registers the `core/post-date` block on the server.
 *
 * @since 5.8.0
 */
function register_block_core_post_date() {
	register_block_type_from_metadata(
		__DIR__ . '/post-date',
		array(
			'render_callback' => 'render_block_core_post_date',
		)
	);
}
add_action( 'init', 'register_block_core_post_date' );
