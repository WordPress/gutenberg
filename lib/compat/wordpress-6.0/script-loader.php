<?php
/**
 * Load the user preset styles separately with lower priority to they will be more
 * likely to load after any theme css that they need to override.
 */

function gutenberg_enqueue_user_preset_styles() {
	$presets_stylesheet = gutenberg_get_global_stylesheet( array( 'presets' ) );

	wp_register_style( 'use-preset-styles', false, array(), true, true );
	wp_add_inline_style( 'use-preset-styles', '.has-background { background-color: var(--wp--user--preset--background-color);} .has-text-color {color: var(--wp--user--preset--color);}' . $presets_stylesheet );
	wp_enqueue_style( 'use-preset-styles' );
}
add_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_user_preset_styles', 100 );
