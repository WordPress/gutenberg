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

	$has_dimensions_support = gutenberg_block_has_support( $block_type, array( '__experimentalDimensions' ), false );
	// Future block supports such as height & width will be added here.

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
	if ( gutenberg_skip_dimensions_serialization( $block_type ) ) {
		return array();
	}

	$styles = array();

	// Height support to be added in near future.
	// Width support to be added in near future.

	return empty( $styles ) ? array() : array( 'style' => implode( ' ', $styles ) );
}

/**
 * Checks whether serialization of the current block's dimensions properties
 * should occur.
 *
 * @param WP_Block_type $block_type Block type.
 * @param string        $feature    Optional name of individual feature to check.
 *
 * @return boolean Whether to serialize dimensions support styles & classes.
 */
function gutenberg_skip_dimensions_serialization( $block_type, $feature = null ) {
	$path               = array( '__experimentalDimensions', '__experimentalSkipSerialization' );
	$skip_serialization = _wp_array_get( $block_type->supports, $path, false );

	if ( is_array( $skip_serialization ) ) {
		return in_array( $feature, $skip_serialization, true );
	}

	return $skip_serialization;
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'dimensions',
	array(
		'register_attribute' => 'gutenberg_register_dimensions_support',
		'apply'              => 'gutenberg_apply_dimensions_support',
	)
);
