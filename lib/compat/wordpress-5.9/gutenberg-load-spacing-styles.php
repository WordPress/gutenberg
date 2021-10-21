<?php
/**
 * Loads the default editor styles.
 *
 * @package gutenberg
 */

function gutenberg_load_spacing_styles_in_editor( $settings ) {
	$styles  = 'body { margin: 0; }';
	$styles .= '.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }';
	$styles .= '.wp-site-blocks > .alignright { float: right; margin-left: 2em; }';
	$styles .= '.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';

	$block_gap_support = gutenberg_get_global_settings( array( 'spacing', 'blockGap' ) );
	if ( null !== $block_gap_support ) {
		$styles .= '.wp-site-blocks > * { margin-top: 0; margin-bottom: 0; }';
		$styles .= '.wp-site-blocks > * + * { margin-top: var( --wp--style--block-gap ); }';
	}

	$settings['styles'][] = array(
		'css'            => $styles,
		'__unstableType' => 'core',
	);

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_load_spacing_styles_in_editor' );

function gutenberg_load_spacing_styles_in_front_end() {
	$styles  = 'body { margin: 0; }';
	$styles .= '.wp-site-blocks > .alignleft { float: left; margin-right: 2em; }';
	$styles .= '.wp-site-blocks > .alignright { float: right; margin-left: 2em; }';
	$styles .= '.wp-site-blocks > .aligncenter { justify-content: center; margin-left: auto; margin-right: auto; }';

	$block_gap_support = gutenberg_get_global_settings( array( 'spacing', 'blockGap' ) );
	if ( null !== $block_gap_support ) {
		$styles .= '.wp-site-blocks > * { margin-top: 0; margin-bottom: 0; }';
		$styles .= '.wp-site-blocks > * + * { margin-top: var( --wp--style--block-gap ); }';
	}

	wp_register_style( 'spacing-styles', false, array(), true, true );
	wp_add_inline_style( 'spacing-styles', $styles );
	wp_enqueue_style( 'spacing-styles' );
}
add_action( 'wp_enqueue_scripts', 'gutenberg_load_spacing_styles_in_front_end' );
