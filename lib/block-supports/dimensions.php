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

	if ( $has_gap_support ) {
		$gap_value = _wp_array_get( $block_attributes, array( 'style', 'spacing', 'blockGap' ), null );

		if ( is_string( $gap_value ) ) {
			$styles[] = sprintf( '--wp--style--block-gap: %s', $gap_value );
		}
	}

	return empty( $styles ) ? array() : array( 'style' => implode( ' ', $styles ) );
}

/**
 * Checks whether serialization of the current block's dimensions properties
 * should occur.
 *
 * @param WP_Block_type $block_type Block type.
 *
 * @return boolean Whether to serialize spacing support styles & classes.
 */
function gutenberg_skip_dimensions_serialization( $block_type ) {
	$dimensions_support = _wp_array_get( $block_type->supports, array( '__experimentalDimensions' ), false );
	return is_array( $dimensions_support ) &&
		array_key_exists( '__experimentalSkipSerialization', $dimensions_support ) &&
		$dimensions_support['__experimentalSkipSerialization'];
}

/**
 * Renders the dimensions support to the block wrapper, for supports that
 * require block-level server-side rendering, for example blockGap support
 * which uses CSS variables.
 *
 * @param  string $block_content Rendered block content.
 * @param  array  $block         Block object.
 * @return string                Filtered block content.
 */
function gutenberg_render_dimensions_support( $block_content, $block ) {
	$block_type      = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	$has_gap_support = gutenberg_block_has_support( $block_type, array( 'spacing', 'blockGap' ), false );
	if ( ! $has_gap_support || ! isset( $block['attrs']['style']['spacing']['blockGap'] ) ) {
		return $block_content;
	}

	$id    = uniqid();
	$style = sprintf(
		'.wp-container-%s { --wp--style--block-gap: %s; }',
		$id,
		esc_attr( $block['attrs']['style']['spacing']['blockGap'] )
	);

	// This assumes the hook only applies to blocks with a single wrapper.
	$content = preg_replace(
		'/' . preg_quote( 'class="', '/' ) . '/',
		'class="wp-container-' . $id . ' ',
		$block_content,
		1
	);

	// Ideally styles should be loaded in the head, but blocks may be parsed
	// after that, so loading in the footer for now.
	// See https://core.trac.wordpress.org/ticket/53494.
	add_action(
		'wp_footer',
		function () use ( $style ) {
			echo '<style>' . $style . '</style>';
		}
	);

	return $content;
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'dimensions',
	array(
		'register_attribute' => 'gutenberg_register_dimensions_support',
		'apply'              => 'gutenberg_apply_dimensions_support',
	)
);

add_filter( 'render_block', 'gutenberg_render_dimensions_support', 10, 2 );
