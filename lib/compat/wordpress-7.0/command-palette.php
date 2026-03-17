<?php
/**
 * Adds the Command Palette trigger button to the admin bar.
 *
 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar instance.
 */
function gutenberg_admin_bar_command_palette_menu( WP_Admin_Bar $wp_admin_bar ): void {
	if ( ! is_admin() || ! wp_script_is( 'wp-core-commands', 'enqueued' ) ) {
		return;
	}

	$is_apple_os    = (bool) preg_match( '/Macintosh|Mac OS X|Mac_PowerPC/i', $_SERVER['HTTP_USER_AGENT'] ?? '' );
	$shortcut_label = $is_apple_os
		? _x( '⌘K', 'keyboard shortcut to open the command palette' )
		: _x( 'Ctrl+K', 'keyboard shortcut to open the command palette' );
	$title          = sprintf(
		'<span class="ab-icon" aria-hidden="true"></span><span class="ab-label"><kbd>%s</kbd><span class="screen-reader-text"> %s</span></span>',
		$shortcut_label,
		/* translators: Hidden accessibility text. */
		__( 'Open command palette' ),
	);
	$wp_admin_bar->add_node(
		array(
			'id'    => 'command-palette',
			'title' => $title,
			'href'  => '#',
			'meta'  => array(
				'class'   => 'hide-if-no-js',
				'onclick' => 'wp.data.dispatch( "core/commands" ).open(); return false;',
			),
		)
	);
}
if ( has_action( 'admin_bar_menu', 'wp_admin_bar_command_palette_menu' ) ) {
	remove_action( 'admin_bar_menu', 'wp_admin_bar_command_palette_menu', 55 );
}
add_action( 'admin_bar_menu', 'gutenberg_admin_bar_command_palette_menu', 55 );

function gutenberg_add_admin_bar_styles() {
	if ( ! is_admin_bar_showing() ) {
			return;
	}
	$css = <<<CSS
		#wpadminbar #wp-admin-bar-command-palette .ab-icon {
			display: none; /* Icon displayed only on mobile */
		}
		#wpadminbar #wp-admin-bar-command-palette .ab-icon:before {
			content: "\\f179";
			content: "\\f179" / '';
		}
		#wpadminbar #wp-admin-bar-command-palette kbd {
			background: transparent;
		}
		@media screen and (max-width: 782px) {
			#wpadminbar #wp-admin-bar-command-palette .ab-icon {
				display: block; /* Icon is only shown on mobile, while the keyboard shortcut is hidden */
			}
			#wpadminbar #wp-admin-bar-command-palette .ab-icon:before {
				text-indent: 0;
				font: normal 32px/1 dashicons;
				width: 52px;
				text-align: center;
				-webkit-font-smoothing: antialiased;
				-moz-osx-font-smoothing: grayscale;
				display: block;
				font-size: 34px;
				height: 46px;
				line-height: 1.38235294;
				top: 0;
			}
			#wpadminbar li#wp-admin-bar-command-palette {
				display: block;
			}
			#wpadminbar #wp-admin-bar-command-palette {
				position: static;
			}
		}
CSS;
	wp_add_inline_style( 'admin-bar', $css );
}
add_action( 'admin_bar_init', 'gutenberg_add_admin_bar_styles' );
