<?php
/**
 * Enqueues the assets required for the Command Palette.
 */
function gutenberg_enqueue_command_palette_assets() {
	if ( ! is_admin() ) {
		return;
	}

	wp_enqueue_script( 'wp-commands' );
	wp_enqueue_style( 'wp-commands' );
	wp_enqueue_script( 'wp-core-commands' );
	wp_add_inline_script( 'wp-core-commands', 'wp.coreCommands.initializeCommandPalette();' );
}

if ( has_filter( 'admin_enqueue_scripts', 'wp_enqueue_command_palette_assets' ) ) {
	remove_filter( 'admin_enqueue_scripts', 'wp_enqueue_command_palette_assets', 9 );
}
add_filter( 'admin_enqueue_scripts', 'gutenberg_enqueue_command_palette_assets', 9 );
