<?php
/**
 * Admin menu dashicon replacement for the "@wordpress/icons in WP Admin" experiment.
 *
 * @package gutenberg
 */

/**
 * Maps dashicon menu slugs as rendered in `div.wp-menu-image` (e.g. `admin-post`) to the core icon that replaces them.
 */
function gutenberg_admin_wp_icons_menu_map() {
	return array(
		'dashboard'        => 'core/dashboard',
		'admin-media'      => 'core/media',
		'admin-post'       => 'core/post',
		'admin-page'       => 'core/page',
		'admin-comments'   => 'core/comment',
		'admin-links'      => 'core/link',
		'admin-appearance' => 'core/brush',
		'admin-plugins'    => 'core/plugins',
		'admin-users'      => 'core/people',
		'admin-tools'      => 'core/tool',
		'admin-settings'   => 'core/settings',
		'admin-multisite'  => 'core/grid',
	);
}

/**
 * Swaps the rendered admin menu dashicons for inline SVGs, since `menu-header.php` exposes no icon hook.
 */
function gutenberg_admin_wp_icons_replace_menu_icons( $html ) {
	$map = gutenberg_admin_wp_icons_menu_map();

	$html = preg_replace_callback(
		'#<div class=([\'"])wp-menu-image dashicons-before dashicons-([a-z0-9-]+)\1[^>]*>.*?</div>#s',
		static function ( $matches ) use ( $map ) {
			if ( ! isset( $map[ $matches[2] ] ) ) {
				return $matches[0];
			}
			$svg = gutenberg_admin_wp_icons_svg( $map[ $matches[2] ] );
			if ( '' === $svg ) {
				return $matches[0];
			}
			return '<div class="wp-menu-image svg-icon" aria-hidden="true">' . $svg . '</div>';
		},
		$html
	);

	$chevron = gutenberg_admin_wp_icons_svg( 'core/chevron-left' );
	if ( '' !== $chevron ) {
		$html = str_replace(
			'<span class="collapse-button-icon" aria-hidden="true"></span>',
			'<span class="collapse-button-icon" aria-hidden="true">' . $chevron . '</span>',
			$html
		);
	}

	return $html;
}

/**
 * Opens an output buffer just before the admin menu is rendered.
 */
function gutenberg_admin_wp_icons_menu_buffer_start() {
	if ( gutenberg_admin_wp_icons_enabled() ) {
		ob_start( 'gutenberg_admin_wp_icons_replace_menu_icons' );
	}
}
add_action( 'admin_head', 'gutenberg_admin_wp_icons_menu_buffer_start', PHP_INT_MAX );

/**
 * Flushes the admin menu output buffer once the menu has been rendered.
 */
function gutenberg_admin_wp_icons_menu_buffer_end() {
	if ( gutenberg_admin_wp_icons_enabled() && ob_get_level() > 0 ) {
		ob_end_flush();
	}
}
add_action( 'in_admin_header', 'gutenberg_admin_wp_icons_menu_buffer_end', PHP_INT_MIN );

/**
 * Sizes and colors the inline SVG admin menu icons.
 */
function gutenberg_admin_wp_icons_menu_assets() {
	if ( ! gutenberg_admin_wp_icons_enabled() ) {
		return;
	}

	$css = <<<CSS
#adminmenu div.wp-menu-image.svg-icon {
	display: flex;
	align-items: center;
	justify-content: center;
}

#adminmenu div.wp-menu-image.svg-icon svg {
	width: 22px;
	height: 22px;
	fill: currentColor;
}

.folded #adminmenu div.wp-menu-image.svg-icon {
	height: 34px;
}

#collapse-button .collapse-button-icon {
	display: flex;
	align-items: center;
	justify-content: center;
}

#collapse-button .collapse-button-icon:after {
	content: none;
}

#collapse-button .collapse-button-icon svg {
	width: 22px;
	height: 22px;
	fill: currentColor;
}

/* rtl:ignore */
.folded #collapse-button .collapse-button-icon svg,
.rtl #collapse-button .collapse-button-icon svg {
	transform: rotate(180deg);
}

.rtl.folded #collapse-button .collapse-button-icon svg {
	transform: none;
}

@media screen and (max-width: 960px) {
	.auto-fold #adminmenu div.wp-menu-image.svg-icon {
		height: 34px;
	}

	/* rtl:ignore */
	.auto-fold #collapse-button .collapse-button-icon svg {
		transform: rotate(180deg);
	}

	.rtl.auto-fold #collapse-button .collapse-button-icon svg {
		transform: none;
	}
}
CSS;

	wp_add_inline_style( 'admin-menu', $css );
}
add_action( 'admin_enqueue_scripts', 'gutenberg_admin_wp_icons_menu_assets' );
