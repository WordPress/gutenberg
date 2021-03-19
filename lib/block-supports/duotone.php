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
		$has_duotone_support = gutenberg_experimental_get( $block_type->supports, array( 'color', 'duotone' ), false );
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
 * Add CSS classes and inline styles for colors to the incoming attributes array.
 * This will be applied to the block markup in the front-end.
 *
 * @param  WP_Block_Type $block_type       Block type.
 * @param  array         $block_attributes Block attributes.
 *
 * @return array Colors CSS classes and inline styles.
 */
function gutenberg_apply_duotone_support( $block_type, $block_attributes ) {
	$attributes          = array();
	$has_duotone_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$has_duotone_support = gutenberg_experimental_get( $block_type->supports, array( 'color', 'duotone' ), false );
	}
	if ( $has_duotone_support ) {
		$has_duotone_attribute = isset( $block_attributes['style']['color']['duotone'] );

		if ( $has_duotone_attribute ) {
			$attributes['class'] = $block_attributes['style']['color']['duotone']['id'];
		}
	}

	return $attributes;
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
		$duotone_support = gutenberg_experimental_get( $block_type->supports, array( 'color', 'duotone' ), false );
	}

	$has_duotone_attribute = isset( $block_attributes['style']['color']['duotone'] );

	if (
		! $duotone_support ||
		! $has_duotone_attribute
	) {
		return $block_content;
	}

	$duotone_id     = $block_attributes['style']['color']['duotone']['id'];
	$duotone_values = $block_attributes['style']['color']['duotone']['values'];

	// Adding the block class as to not affect other blocks.
	$block_class = gutenberg_get_block_default_classname( $block_type->name );
	$scope       = '.' . $block_class . '.' . $duotone_id;

	// Object | boolean | string | string[] -> boolean | string | string[].
	$selector =
		! is_array( $duotone_support ) || ! array_key_exists( 'edit', $duotone_support )
			? $duotone_support
			: $duotone_support['edit'];

	// boolean | string | string[] -> boolean[] | string[].
	$selector = is_array( $selector )
		? $selector
		: array( $selector );

	// boolean[] | string[] -> string[].
	$selector = array_map(
		function ( $selector ) use ( $scope ) {
			return is_string( $selector )
				? $scope . ' ' . $selector
				: $scope;
		},
		$selector
	);

	// string[] -> string.
	$selector = implode( ', ', $selector );

	$duotone = gutenberg_render_duotone_filter( $selector, $duotone_id, $duotone_values );

	return $block_content . $duotone;
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'duotone',
	array(
		'register_attribute' => 'gutenberg_register_duotone_support',
		'apply'              => 'gutenberg_apply_duotone_support',
		'render_block'       => 'gutenberg_render_duotone_support',
	)
);
