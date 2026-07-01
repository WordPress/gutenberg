<?php
/**
 * Admin bar dashicon replacement for the "@wordpress/icons in WP Admin" experiment.
 *
 * @package gutenberg
 */

/**
 * Returns an admin bar icon wrapper containing the inline SVG for a core icon.
 */
function gutenberg_admin_wp_icons_ab_icon( $icon_name ) {
	$svg = gutenberg_admin_wp_icons_svg( $icon_name );
	if ( '' === $svg ) {
		return '';
	}
	return '<span class="ab-icon svg-icon" aria-hidden="true">' . $svg . '</span>';
}

/**
 * Replaces the admin bar dashicons with @wordpress/icons SVGs, running late so every core node already exists.
 */
function gutenberg_admin_wp_icons_admin_bar( $wp_admin_bar ) {
	if ( ! is_admin_bar_showing() || ! gutenberg_admin_wp_icons_enabled() ) {
		return;
	}

	$icon_map = array(
		'wp-logo'         => 'core/wordpress',
		'menu-toggle'     => 'core/menu',
		'command-palette' => 'core/search',
		'new-content'     => 'core/plus',
		'comments'        => 'core/comment',
		'updates'         => 'core/update',
		'site-editor'     => 'core/brush',
		'customize'       => 'core/brush',
		'my-sites'        => 'core/grid',
		'edit'            => 'core/pencil',
	);

	$placeholder    = '<span class="ab-icon" aria-hidden="true"></span>';
	$blavatar_empty = '<div class="blavatar"></div>';
	$blavatar_icon  = gutenberg_admin_wp_icons_svg( 'core/wordpress', 16 );

	foreach ( $wp_admin_bar->get_nodes() as $id => $node ) {
		$title = $node->title;
		if ( ! is_string( $title ) || '' === $title ) {
			continue;
		}

		$new_title = $title;

		// The site icons listed under "My Sites".
		if ( '' !== $blavatar_icon && false !== strpos( $new_title, $blavatar_empty ) ) {
			$new_title = str_replace(
				$blavatar_empty,
				'<div class="blavatar">' . $blavatar_icon . '</div>',
				$new_title
			);
		}

		if ( isset( $icon_map[ $id ] ) ) {
			$icon = gutenberg_admin_wp_icons_ab_icon( $icon_map[ $id ] );
			if ( '' !== $icon ) {
				$new_title = false !== strpos( $new_title, $placeholder )
					? str_replace( $placeholder, $icon, $new_title )
					: $icon . $new_title;
			}
		} elseif ( 'site-name' === $id ) {
			if ( false === strpos( $new_title, 'class="site-icon"' ) ) {
				$icon_name = ( is_admin() || ! current_user_can( 'read' ) ) ? 'core/home' : 'core/dashboard';
				$new_title = gutenberg_admin_wp_icons_ab_icon( $icon_name ) . $new_title;
			}
		} elseif ( 'my-account' === $id && false === strpos( $new_title, '<img' ) ) {
			$new_title = gutenberg_admin_wp_icons_ab_icon( 'core/people' ) . $new_title;
		} elseif ( 'search' === $id ) {
			$new_title = str_replace(
				'<input class="adminbar-input"',
				gutenberg_admin_wp_icons_ab_icon( 'core/search' ) . '<input class="adminbar-input"',
				$new_title
			);
		}

		if ( $new_title !== $title ) {
			$wp_admin_bar->add_node(
				array(
					'id'    => $id,
					'title' => $new_title,
				)
			);
		}
	}
}
add_action( 'admin_bar_menu', 'gutenberg_admin_wp_icons_admin_bar', 100000 );

/**
 * Adds the admin bar styles that size the SVG icons and suppress core's leftover dashicon pseudo-elements.
 */
function gutenberg_admin_wp_icons_admin_bar_styles() {
	if ( ! is_admin_bar_showing() || ! gutenberg_admin_wp_icons_enabled() ) {
		return;
	}

	// The scheme colors the dashicon `:before`, not the `.ab-icon` element, so the
	// SVG icon rest/hover colors (Core's $menu-icon / $menu-submenu-focus-text) are
	// applied here for the active scheme, or the default scheme on the front end
	// (which never loads the user's color scheme).
	$schemes    = array(
		'fresh'     => array( 'rgba(240, 246, 252, 0.6)', '#72aee6' ),
		'light'     => array( '#999', '#007cba' ),
		'blue'      => array( '#e5f8ff', '#fff' ),
		'coffee'    => array( 'hsl(27.6923076923, 7%, 95%)', '#fff' ),
		'ectoplasm' => array( '#ece6f6', '#fff' ),
		'midnight'  => array( 'hsl(206.6666666667, 7%, 95%)', '#fff' ),
		'modern'    => array( 'hsl(0, 7%, 95%)', '#7b90ff' ),
		'ocean'     => array( '#f2fcff', '#fff' ),
		'sunrise'   => array( 'hsl(2.1582733813, 7%, 95%)', '#fff' ),
	);
	$scheme     = is_admin() ? (string) get_user_option( 'admin_color' ) : 'fresh';
	$colors     = $schemes[ $scheme ] ?? $schemes['fresh'];
	$icon_color = $colors[0];
	$icon_hover = $colors[1];

	$css = <<<CSS
#wpadminbar .ab-icon.svg-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	box-sizing: border-box;
	height: 32px;
	padding: 0;
	margin-right: 4px;
	color: {$icon_color};
}

#wpadminbar > #wp-toolbar > #wp-admin-bar-root-default .ab-icon.svg-icon {
	margin-right: 4px;
}

#wpadminbar li:hover .ab-icon.svg-icon,
#wpadminbar li a:focus .ab-icon.svg-icon,
#wpadminbar li .ab-item:focus .ab-icon.svg-icon,
#wpadminbar li.hover .ab-icon.svg-icon {
	color: {$icon_hover};
}

#wpadminbar .ab-icon.svg-icon:before {
	content: none !important;
}

#wpadminbar .ab-icon svg {
	width: 22px;
	height: 22px;
	fill: currentColor;
	transition: color .1s ease-in-out;
}

#wpadminbar #wp-admin-bar-my-account > .ab-item:before,
#wpadminbar #wp-admin-bar-my-sites > .ab-item:before,
#wpadminbar #wp-admin-bar-site-name > .ab-item:before,
#wpadminbar #wp-admin-bar-site-editor > .ab-item:before,
#wpadminbar #wp-admin-bar-customize > .ab-item:before,
#wpadminbar #wp-admin-bar-edit > .ab-item:before,
#wpadminbar #adminbarsearch:before {
	content: none !important;
}

#wpadminbar #wp-toolbar #wp-admin-bar-wp-logo > .ab-item .ab-icon.svg-icon {
	width: auto;
	height: 32px;
	margin-right: 0;
}

#wpadminbar #wp-admin-bar-wp-logo .ab-icon svg {
	width: 24px;
	height: 24px;
}

#wpadminbar #wp-admin-bar-my-account > .ab-item .ab-icon {
	float: right;
	margin-left: 6px;
	margin-right: 0;
}

#wpadminbar .quicklinks li .blavatar {
	line-height: 0;
}

#wpadminbar .quicklinks li div.blavatar svg {
	display: inline-block;
	width: 16px;
	height: 16px;
	margin: 0 8px 0 -2px;
	fill: currentColor;
	position: relative;
	top: -2px;
}

#wpadminbar #wp-admin-bar-updates.spin .ab-icon svg {
	animation: rotation 2s infinite linear;
}

@media (prefers-reduced-motion: reduce) {
	#wpadminbar #wp-admin-bar-updates.spin .ab-icon svg {
		animation: none;
	}
}

#wpadminbar #adminbarsearch .ab-icon {
	position: absolute;
	top: 6px;
	left: 5px;
	z-index: 20;
	height: auto;
	pointer-events: none;
}

@media screen and (max-width: 782px) {
	#wpadminbar > #wp-toolbar > #wp-admin-bar-root-default .ab-icon.svg-icon,
	#wpadminbar .ab-icon.svg-icon {
		width: 52px;
		height: 46px;
		margin-right: 0;
	}

	#wpadminbar #wp-toolbar #wp-admin-bar-wp-logo > .ab-item .ab-icon.svg-icon {
		width: 52px;
		height: 46px;
		margin-right: 0;
	}

	#wpadminbar #wp-admin-bar-menu-toggle .ab-icon svg {
		width: 36px;
		height: 36px;
	}

	#wpadminbar .ab-icon svg {
		width: 34px;
		height: 34px;
	}

	#wpadminbar #wp-admin-bar-wp-logo .ab-icon svg {
		width: 32px;
		height: 32px;
	}
}
CSS;

	wp_add_inline_style( 'admin-bar', $css );
}
add_action( 'wp_enqueue_scripts', 'gutenberg_admin_wp_icons_admin_bar_styles' );
add_action( 'admin_enqueue_scripts', 'gutenberg_admin_wp_icons_admin_bar_styles' );
