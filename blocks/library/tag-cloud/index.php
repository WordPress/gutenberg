<?php
/**
 * Server-side rendering of the `core/tag-cloud` block.
 *
 * @package gutenberg
 */

/**
 * Renders the `core/tag-cloud` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Returns the tag cloud for selected taxonomy.
 */
function gutenberg_render_block_core_tag_cloud( $attributes ) {
	$align = 'center';
	if ( isset( $attributes['align'] ) && in_array( $attributes['align'], array( 'left', 'right', 'full' ), true ) ) {
		$align = $attributes['align'];
	}

	$class          = "wp-block-tag-cloud align{$align}";
	$wrapper_markup = '<p class="%1$s">%2$s</p>';

	$args = array(
		'echo'       => false,
		'taxonomy'   => $attributes['taxonomy'],
		'show_count' => ! empty( $attributes['showTagCounts'] ),
	);

	$tag_cloud = wp_tag_cloud( $args );

	$block_content = sprintf(
		$wrapper_markup,
		esc_attr( $class ),
		$tag_cloud
	);

	return $block_content;
}

register_block_type( 'core/tag-cloud', array(
	'render_callback' => 'gutenberg_render_block_core_tag_cloud',
) );
