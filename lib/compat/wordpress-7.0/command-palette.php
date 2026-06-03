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

	$shortcut_labels = array(
		'appleOS' => _x( '⌘K', 'keyboard shortcut to open the command palette' ),
		'default' => _x( 'Ctrl+K', 'keyboard shortcut to open the command palette' ),
	);
	$apple_pattern   = 'Macintosh|Mac OS X|Mac_PowerPC';
	$is_apple_os     = (bool) preg_match( "/{$apple_pattern}/i", $_SERVER['HTTP_USER_AGENT'] ?? '' );
	$shortcut_label  = $is_apple_os ? $shortcut_labels['appleOS'] : $shortcut_labels['default'];
	$title           = sprintf(
		'<span class="ab-icon" aria-hidden="true"></span><span class="ab-label"><kbd>%s</kbd><span class="screen-reader-text"> %s</span></span>',
		$shortcut_label,
		/* translators: Hidden accessibility text. */
		__( 'Open command palette' ),
	);

	/*
	 * Detect Apple OS via JavaScript for sites behind a CDN blocking the UA header.
	 *
	 * Running the script as the admin bar is rendered avoids a flash of incorrect content
	 * for users with Apple OS when the UA header is blocked. It also prevents the need for
	 * wp-i18n to be loaded as a dependency.
	 */
	$function = <<<'JS'
		( applePattern, appleOSLabel ) => {
			if ( ( new RegExp( applePattern ) ).test( navigator.userAgent ) ) {
				document.querySelector( '#wp-admin-bar-command-palette .ab-label kbd' ).textContent = appleOSLabel;
			}
		}
	JS;
	$script   = sprintf(
		'( %s )( %s, %s );',
		$function,
		wp_json_encode( $apple_pattern, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES ),
		wp_json_encode( $shortcut_labels['appleOS'], JSON_HEX_TAG | JSON_UNESCAPED_SLASHES )
	);
	$script  .= "\n//# sourceURL=" . rawurlencode( __FUNCTION__ );
	$wp_admin_bar->add_node(
		array(
			'id'    => 'command-palette',
			'title' => $title,
			'href'  => '#',
			'meta'  => array(
				'class'   => 'hide-if-no-js',
				'onclick' => 'wp.data.dispatch( "core/commands" ).open(); return false;',
				'html'    => wp_get_inline_script_tag( $script ),
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
