<?php
/**
 * WordPress scripts and styles default loader.
 *
 * @package gutenberg
 */

/**
 * Register the base styles asset.
 *
 * @param WP_Styles $styles WP_Styles instance.
 */
function gutenberg_register_admin_schemes_stylesheet( $styles ) {

	$styles->add(
		'wp-base-styles',
		gutenberg_url( 'build/base-styles/admin-schemes.css' )
	);
}
add_action( 'wp_default_styles', 'gutenberg_register_admin_schemes_stylesheet' );
