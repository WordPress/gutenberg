<?php
/**
 * Duotone block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the style and colors block attributes for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_duotone_support( $block_type ) {
	$has_duotone_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$has_duotone_support = _wp_array_get( $block_type->supports, array( 'color', 'duotone' ), false );
	}

	if ( $has_duotone_support ) {
		if ( ! $block_type->attributes ) {
			$block_type->attributes = array();
		}

		if ( ! array_key_exists( 'style', $block_type->attributes ) ) {
			$block_type->attributes['style'] = array(
				'type' => 'object',
			);
		}
	}
}

/**
 * Render out the duotone stylesheet and SVG.
 *
 * @param  WP_Block_Type $block_type       Block type.
 * @param  array         $block_attributes Block attributes.
 * @param  string        $block_content    Rendered block content.
 *
 * @return string filtered block content.
 */
function gutenberg_render_duotone_support( $block_type, $block_attributes, $block_content ) {
	$duotone_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$duotone_support = _wp_array_get( $block_type->supports, array( 'color', 'duotone' ), false );
	}

	$has_duotone_attribute = isset( $block_attributes['style']['color']['duotone'] );

	if (
		! $duotone_support ||
		! $has_duotone_attribute
	) {
		return $block_content;
	}

	$duotone_attribute = $block_attributes['style']['color']['duotone'];

	$slug_or_id = isset( $duotone_attribute['slug'] ) ? $duotone_attribute['slug'] : uniqid();

	$duotone_values = $duotone_attribute['values'];
	$duotone_id     = 'wp-duotone-filter-' . $slug_or_id;

	$selectors        = explode( ',', $duotone_support );
	$selectors_scoped = array_map(
		function ( $selector ) use ( $duotone_id ) {
			return '.' . $duotone_id . ' ' . trim( $selector );
		},
		$selectors
	);
	$selectors_group  = implode( ', ', $selectors_scoped );

	$duotone = gutenberg_render_duotone_filter( $selectors_group, $duotone_id, $duotone_values );

	// Like the layout hook, this assumes the hook only applies to blocks with a single wrapper.
	$content = preg_replace(
		'/' . preg_quote( 'class="', '/' ) . '/',
		'class="' . $duotone_id . ' ',
		$block_content,
		1
	);

	return $content . $duotone;
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'duotone',
	array(
		'register_attribute' => 'gutenberg_register_duotone_support',
		'render_block'       => 'gutenberg_render_duotone_support',
	)
);
