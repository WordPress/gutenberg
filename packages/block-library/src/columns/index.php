<?php
/**
 * Server-side rendering of the `core/columns` block.
 *
 * @package WordPress
 */

/**
 * Dynamically renders the `core/columns` block.
 *
 * @param array    $attributes The block attributes.
 * @param string   $content    The saved block content.
 * @param WP_Block $block      Block instance.
 *
 * @return string The columns block markup.
 */
function render_block_core_columns( $attributes, $content, $block ) {
	$styles = array();

	$grid_template_columns = grid_template_column_styles_for_block_core_columns( $attributes, $block );

	if ( ! empty( $grid_template_columns ) ) {
		$styles[] = esc_attr( 'grid-template-columns: ' . $grid_template_columns  . ';' );
	}
	if ( ! empty( $attributes['gridGap'] ) && ! empty( $attributes['gridGapUnit'] ) ) {
		$styles[] = esc_attr( 'gap: ' . $attributes['gridGap'] . $attributes['gridGapUnit'] . ';' );
	}

	$style = implode( ' ', $styles );

	$wrapper_attributes = get_block_wrapper_attributes(
		array(
			'style' => $style
		)
	);

	return preg_replace(
		'/<div.*>/',
		'<div ' . $wrapper_attributes . '>',
		$content,
		1
	);
}

/**
 * Builds a string of inline styles for the columns block.
 *
 * @param  array   $attributes The block attributes.
 * @param WP_Block $block      Block instance.
 *
 * @return string Style HTML attribute.
 */
function grid_template_column_styles_for_block_core_columns( $attributes, $block ) {
	$grid_template_columns = [];

	if ( ! empty( $block->inner_blocks ) ) {
		foreach( $block->inner_blocks as $inner_block ) {
			// Deal with explicitly set width values for column blocks, and fall back
			// to treating the column as 1fr if no width value is set.
			if (
				! empty( $inner_block->attributes['width'] ) &&
				'0' !== $inner_block->attributes['width']
			) {
				// Skip converting non-percentage based widths to `fr` units.
				if ( false === strpos( $inner_block->attributes['width'], '%' ) ) {
					$grid_template_columns[] = $inner_block->attributes['width'];
				} else {
					$percentage = floatval( $inner_block->attributes['width'] );
					$fr_value = round( ( $percentage / 100 ) * count( $block->inner_blocks ), 2 );
					$grid_template_columns[] = $fr_value . 'fr';
				}
			} else {
				$grid_template_columns[] = '1fr';
			}
		}
	}

	return implode( ' ', $grid_template_columns );
}

/**
 * Registers the `core/search` block on the server.
 */
function register_block_core_columns() {
	register_block_type_from_metadata(
		__DIR__ . '/columns',
		array(
			'render_callback' => 'render_block_core_columns',
		)
	);
}
add_action( 'init', 'register_block_core_columns' );
