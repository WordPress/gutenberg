<?php
/**
 * Border block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the style attribute used by the border feature if needed for block
 * types that support borders.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_border_support( $block_type ) {
	// Determine if any border related features are supported.
	$has_border_support       = gutenberg_block_has_support( $block_type, array( '__experimentalBorder' ) );
	$has_border_color_support = gutenberg_has_border_feature_support( $block_type, 'color' );

	// Setup attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( $has_border_support && ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}

	if ( $has_border_color_support && ! array_key_exists( 'borderColor', $block_type->attributes ) ) {
		$block_type->attributes['borderColor'] = array(
			'type' => 'string',
		);
	}
}

/**
 * Adds CSS classes and inline styles for border styles to the incoming
 * attributes array. This will be applied to the block markup in the front-end.
 *
 * @param WP_Block_type $block_type       Block type.
 * @param array         $block_attributes Block attributes.
 *
 * @return array Border CSS classes and inline styles.
 */
function gutenberg_apply_border_support( $block_type, $block_attributes ) {
	if ( gutenberg_skip_border_serialization( $block_type ) ) {
		return array();
	}

	$classes = array();
	$styles  = array();

	// Border radius.
	if (
		gutenberg_has_border_feature_support( $block_type, 'radius' ) &&
		isset( $block_attributes['style']['border']['radius'] )
	) {
		$border_radius = $block_attributes['style']['border']['radius'];

		if ( is_array( $border_radius ) ) {
			// We have individual border radius corner values.
			foreach ( $border_radius as $key => $radius ) {
				// Convert CamelCase corner name to kebab-case.
				$corner   = strtolower( preg_replace( '/(?<!^)[A-Z]/', '-$0', $key ) );
				$styles[] = sprintf( 'border-%s-radius: %s;', $corner, $radius );
			}
		} else {
			// This check handles original unitless implementation.
			if ( is_numeric( $border_radius ) ) {
				$border_radius .= 'px';
			}

			$styles[] = sprintf( 'border-radius: %s;', $border_radius );
		}
	}

	// Border style.
	if (
		gutenberg_has_border_feature_support( $block_type, 'style' ) &&
		isset( $block_attributes['style']['border']['style'] )
	) {
		$border_style = $block_attributes['style']['border']['style'];
		$styles[]     = sprintf( 'border-style: %s;', $border_style );
	}

	// Border width.
	if (
		gutenberg_has_border_feature_support( $block_type, 'width' ) &&
		isset( $block_attributes['style']['border']['width'] )
	) {
		$border_width = $block_attributes['style']['border']['width'];

		// This check handles original unitless implementation.
		if ( is_numeric( $border_width ) ) {
			$border_width .= 'px';
		}

		$styles[] = sprintf( 'border-width: %s;', $border_width );
	}

	// Border color.
	if ( gutenberg_has_border_feature_support( $block_type, 'color' ) ) {
		$has_named_border_color  = array_key_exists( 'borderColor', $block_attributes );
		$has_custom_border_color = isset( $block_attributes['style']['border']['color'] );

		if ( $has_named_border_color || $has_custom_border_color ) {
			$classes[] = 'has-border-color';
		}

		if ( $has_named_border_color ) {
			$classes[] = sprintf( 'has-%s-border-color', $block_attributes['borderColor'] );
		} elseif ( $has_custom_border_color ) {
			$border_color = $block_attributes['style']['border']['color'];
			$styles[]     = sprintf( 'border-color: %s;', $border_color );
		}
	}

	// Collect classes and styles.
	$attributes = array();

	if ( ! empty( $classes ) ) {
		$attributes['class'] = implode( ' ', $classes );
	}

	if ( ! empty( $styles ) ) {
		$attributes['style'] = implode( ' ', $styles );
	}

	return $attributes;
}

/**
 * Checks whether serialization of the current block's border properties should
 * occur.
 *
 * @param WP_Block_type $block_type       Block type.
 *
 * @return boolean
 */
function gutenberg_skip_border_serialization( $block_type ) {
	$border_support = _wp_array_get( $block_type->supports, array( '__experimentalBorder' ), false );

	return is_array( $border_support ) &&
		array_key_exists( '__experimentalSkipSerialization', $border_support ) &&
		$border_support['__experimentalSkipSerialization'];
}

/**
 * Checks whether the current block type supports the border feature requested.
 *
 * If the `__experimentalBorder` support flag is a boolean `true` all border
 * support features are available. Otherwise, the specific feature's support
 * flag nested under `experimentalBorder` must be enabled for the feature
 * to be opted into.
 *
 * @param WP_Block_Type $block_type Block type to check for support.
 * @param string        $feature    Name of the feature to check support for.
 * @param mixed         $default    Fallback value for feature support, defaults to false.
 *
 * @return boolean                  Whether or not the feature is supported.
 */
function gutenberg_has_border_feature_support( $block_type, $feature, $default = false ) {
	// Check if all border support features have been opted into via `"__experimentalBorder": true`.
	if (
		property_exists( $block_type, 'supports' ) &&
		( true === _wp_array_get( $block_type->supports, array( '__experimentalBorder' ), $default ) )
	) {
		return true;
	}

	// Check if the specific feature has been opted into individually
	// via nested flag under `__experimentalBorder`.
	return gutenberg_block_has_support( $block_type, array( '__experimentalBorder', $feature ), $default );
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'border',
	array(
		'register_attribute' => 'gutenberg_register_border_support',
		'apply'              => 'gutenberg_apply_border_support',
	)
);
