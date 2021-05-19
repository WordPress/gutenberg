<?php
/**
 * Server-side rendering of the `core/columns` block.
 *
 * @package WordPress
 */

/**
 * Dynamically renders the `core/columns` block.
 *
 * @param  array  $attributes The block attributes.
 * @param  string $content    The saved block content.
 *
 * @return string The columns block markup.
 */
function render_block_core_columns( $attributes, $content ) {
	$has_margins = ! empty( $attributes['style']['spacing']['margin'] );

	if ( ! $has_margins ) {
		return $content;
	}

	$css_variables = css_vars_for_block_core_columns( $attributes );

	// Add CSS vars for margins. This is to allow CSS media queries to take into
	// account the margins when setting flex-basis for the columns.
	$match = preg_match( '/^(<[^>]+ style=".*?)(".*>.*)/', $content, $matches );

	if ( $match ) {
		// Style attribute is present, add CSS variables to it.
		return $matches[1] . ' ' . $css_variables . $matches[2];
	}

	// No style present on root columns element. Add one with CSS vars.
	$style = 'style="' . $css_variables . ' "';

	return preg_replace( '/>/', $style . '$0', $content, 1 );
}

/**
 * Builds CSS variables to be applied via inline styles for the columns block.
 *
 * @param array $attributes The Columns block attributes.
 * @return string           CSS variables for use within inline styles.
 */
function css_vars_for_block_core_columns( $attributes ) {
	$css_variables = array();
	$margin_path   = array( 'style', 'spacing', 'margin' );
	$margins       = _wp_array_get( $attributes, $margin_path, array() );

	foreach ( $margins as $side => $value ) {
		$css_variables[] = sprintf(
			'--wp-block-columns--margin-%s:%s;',
			$side,
			$value
		);
	}

	return implode( '', $css_variables );
}

/**
 * Registers the `core/columns` block on the server.
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
