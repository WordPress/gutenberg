<?php
/**
 * Adds the Command Palette trigger button to the admin bar.
 *
 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar instance.
 */
function gutenberg_admin_bar_command_palette_menu( $wp_admin_bar ) {
	if ( ! is_admin() ) {
		return;
	}

	$is_apple_os    = (bool) preg_match( '/Macintosh|Mac OS X|Mac_PowerPC/i', $_SERVER['HTTP_USER_AGENT'] ?? '' );
	$shortcut_label = $is_apple_os
		? _x( '⌘K', 'keyboard shortcut to open the command palette', 'gutenberg' )
		: _x( 'Ctrl+K', 'keyboard shortcut to open the command palette', 'gutenberg' );
	$title          = sprintf(
		'<span class="ab-label"><kbd>%s</kbd><span class="screen-reader-text"> %s</span></span>',
		$shortcut_label,
		/* translators: Hidden accessibility text. */
		__( 'Open command palette', 'gutenberg' ),
	);
	$wp_admin_bar->add_node(
		array(
			'id'    => 'command-palette',
			'title' => $title,
			'href'  => '#',
			'meta'  => array( 'class' => 'hide-if-no-js' ),
		)
	);
}
if ( has_action( 'admin_bar_menu', 'wp_admin_bar_command_palette_menu' ) ) {
	remove_action( 'admin_bar_menu', 'wp_admin_bar_command_palette_menu', 55 );
}
add_action( 'admin_bar_menu', 'gutenberg_admin_bar_command_palette_menu', 55 );
