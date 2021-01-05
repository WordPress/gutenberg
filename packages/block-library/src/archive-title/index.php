<?php
/**
 * Server-side rendering of the `core/archive-title` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/archive-title` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 *
 * @return string Returns the filtered archive title based on the queried object.
 */
function render_block_core_archive_title( $attributes, $content, $block ) {
	if ( ! is_archive() ) {
		return '';
	}

	$tag_name           = isset( $attributes['level'] ) ? 'h' . $attributes['level'] : 'h2';
	$align_class_name   = empty( $attributes['textAlign'] ) ? '' : "has-text-align-{$attributes['textAlign']}";
	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => $align_class_name ) );

	return sprintf(
		'<%1$s %2$s>%3$s</%1$s>',
		$tag_name,
		$wrapper_attributes,
		get_the_archive_title()
	);
}

/**
 * Registers the `core/archive-title` block on the server.
 */
function register_block_core_archive_title() {
	register_block_type_from_metadata(
		__DIR__ . '/archive-title',
		array(
			'render_callback' => 'render_block_core_archive_title',
		)
	);
}
add_action( 'init', 'register_block_core_archive_title' );



