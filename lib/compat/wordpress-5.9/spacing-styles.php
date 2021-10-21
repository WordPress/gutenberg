<?php
/**
 * Loads the spacing styles.
 *
 * @package gutenberg
 */

/**
 * Callback to load the spacing styles in the editor.
 *
 * @param array $settings The existing editor settings.
 * @return array The filtered editor settings.
 */
function gutenberg_load_spacing_styles_in_editor( $settings ) {
	if ( ! WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() ) {
		return $settings;
	}

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

/**
 * Callback to enqueue spacing styles in the front.
 */
function gutenberg_load_spacing_styles_in_front_end() {
	if ( ! WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() ) {
		return;
	}

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
