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
function render_block_core_tag_cloud( $attributes ) {
	$class          = "wp-block-tag-cloud align{$attributes['align']}";
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

/**
 * Registers the `core/tag-cloud` block on server.
 */
function register_block_core_tag_cloud() {
	register_block_type(
		'core/tag-cloud',
		array(
			'attributes'      => array(
				'taxonomy'      => array(
					'type' => 'string',
				),
				'showTagCounts' => array(
					'type'    => 'boolean',
					'default' => false,
				),
				'align'         => array(
					'type'    => 'string',
					'default' => 'center',
				),
			),
			'render_callback' => 'render_block_core_tag_cloud',
		)
	);
}

add_action( 'init', 'register_block_core_tag_cloud' );
