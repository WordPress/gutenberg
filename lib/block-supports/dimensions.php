<?php
/**
 * Dimensions block support flag.
 *
 * This does not include the `spacing` block support even though that visually
 * appears under the "Dimensions" panel in the editor. It remains in its
 * original `spacing.php` file for compatibility with core.
 *
 * @package gutenberg
 */

/**
 * Registers the style block attribute for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_dimensions_support( $block_type ) {
	// Setup attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	// Check for existing style attribute definition e.g. from block.json.
	if ( array_key_exists( 'style', $block_type->attributes ) ) {
		return;
	}

	$has_dimensions_support = block_has_support( $block_type, array( 'dimensions' ), false );

	if ( $has_dimensions_support ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

/**
 * Add CSS classes for block dimensions to the incoming attributes array.
 * This will be applied to the block markup in the front-end.
 *
 * @param WP_Block_Type $block_type       Block Type.
 * @param array         $block_attributes Block attributes.
 *
 * @return array Block dimensions CSS classes and inline styles.
 */
function gutenberg_apply_dimensions_support( $block_type, $block_attributes ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	if ( wp_should_skip_block_supports_serialization( $block_type, 'dimensions' ) ) {
		return array();
	}

	$attributes = array();

	// Width support to be added in near future.

	$has_min_height_support = block_has_support( $block_type, array( 'dimensions', 'minHeight' ), false );
	$block_styles           = isset( $block_attributes['style'] ) ? $block_attributes['style'] : null;

	if ( ! $block_styles ) {
		return $attributes;
	}

	$skip_min_height                      = wp_should_skip_block_supports_serialization( $block_type, 'dimensions', 'minHeight' );
	$dimensions_block_styles              = array();
	$dimensions_block_styles['minHeight'] = null;
	if ( $has_min_height_support && ! $skip_min_height ) {
		$dimensions_block_styles['minHeight'] = isset( $block_styles['dimensions']['minHeight'] )
			? _wp_array_get( $block_styles, array( 'dimensions', 'minHeight' ), null )
			: null;
	}
	$styles = gutenberg_style_engine_get_styles( array( 'dimensions' => $dimensions_block_styles ) );

	if ( ! empty( $styles['css'] ) ) {
		$attributes['style'] = $styles['css'];
	}

	return $attributes;
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'dimensions',
	array(
		'register_attribute' => 'gutenberg_register_dimensions_support',
		'apply'              => 'gutenberg_apply_dimensions_support',
	)
);
