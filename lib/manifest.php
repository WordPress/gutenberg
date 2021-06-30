<?php
/**
 * Progressive Web App Manifest
 *
 * @package gutenberg
 */

global $_wp_admin_css_colors;

$color_scheme    = get_user_option( 'admin_color' );
$colors          = $_wp_admin_css_colors[ $color_scheme ]->colors;
$admin_bar_color = $colors[0];
$body_background = '#f1f1f1';

$icon_sizes = array( 32, 180, 192, 270, 512 );

// Ideally we have the WordPress logo as the default app logo in the sizes
// below.
$icons = array();

if ( has_site_icon() ) {
	$type = wp_check_filetype( get_site_icon_url() );

	foreach ( $icon_sizes as $size ) {
		$icons[] = array(
			'src'   => get_site_icon_url( $size ),
			'sizes' => $size . 'x' . $size,
			'type'  => $type['type'],
		);
	}
}

wp_send_json(
	array(
		'name'             => get_bloginfo( 'name' ),
		'icons'            => $icons,
		'background_color' => $body_background,
		'theme_color'      => $admin_bar_color,
		'display'          => 'standalone',
		'orientation'      => 'portrait',
		'start_url'        => admin_url(),
		// Open front-end, login page, and any external URLs in a browser modal.
		'scope'            => admin_url(),
	)
);
