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
function gutenberg_register_has_duotone_support( $block_type ) {
	$has_duotone_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$has_duotone_support = gutenberg_experimental_get( $block_type->supports, array( 'duotone' ), false );
	}

	if ( $has_duotone_support ) {
		if ( ! $block_type->attributes ) {
			$block_type->attributes = array();
		}

		if ( ! array_key_exists( 'duotoneId', $block_type->attributes ) ) {
			$block_type->attributes['duotoneId'] = array(
				'type' => 'string',
			);
		}

		if ( ! array_key_exists( 'duotoneColors', $block_type->attributes ) ) {
			$block_type->attributes['duotoneColors'] = array(
				'type' => 'array',
			);
		}
	}
}


/**
 * Add CSS classes and inline styles for colors to the incoming attributes array.
 * This will be applied to the block markup in the front-end.
 *
 * @param  array         $attributes       Comprehensive list of attributes to be applied.
 * @param  array         $block_attributes Block attributes.
 * @param  WP_Block_Type $block_type       Block type.
 *
 * @return array Colors CSS classes and inline styles.
 */
function gutenberg_apply_duotone_support( $attributes, $block_attributes, $block_type ) {
	$has_duotone_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$has_duotone_support = gutenberg_experimental_get( $block_type->supports, array( 'duotone' ), false );
	}
	if ( $has_duotone_support ) {
		$has_duotone_id     = array_key_exists( 'duotoneId', $block_attributes );
		$has_duotone_colors = array_key_exists( 'duotoneColors', $block_attributes );

		if ( $has_duotone_id && $has_duotone_colors ) {
			$attributes['css_classes'][] = $block_attributes['duotoneId'];
		}
	}

	return $attributes;
}

/**
 * Render out the duotone stylesheet and SVG.
 *
 * @param  string $block_content rendered block content.
 * @param  array  $block_attributes Block attributes.
 *
 * @return string filtered block content.
 */
function gutenberg_render_duotone_support( $block_content, $block_attributes ) {
	$has_duotone_id     = array_key_exists( 'duotoneId', $block_attributes );
	$has_duotone_colors = array_key_exists( 'duotoneColors', $block_attributes );

	if ( ! $has_duotone_id || ! $has_duotone_colors ) {
		return $block_content;
	}

	ob_start();
	include 'template.php';
	$duotone = ob_get_clean();

	return $block_content . $duotone;
}
